import { DiscoveryData, MQTTClimateDiscoveryPayload } from "../interfaces";
import { CONTROL_OBJECTID_PREFIX, MQTT_BRIDGE_PREFIX } from "../constants";
import { snakeCase } from "lodash";
import { getDiscoveryDeviceDetails } from "../device";
import { Device } from "@/models/Device";
import { Control } from "@/models/Control";
import { log } from "@/libraries/Log";
import { ACSettings } from "@/models/ACSettings";
import mqtt from "mqtt";
import acSettingsService from "@/services/ACSettingsService";

class ClimateEntity {
  public client: mqtt.Client;

  init(client: mqtt.Client) {
    this.client = client;
    this.startHandlingDeviceEvents(); // State changes
    this.startHandlingCommands(); // Commands from HASS
  }

  async generateDiscoveryData(
    control: Control,
    device: Device,
  ): Promise<DiscoveryData> {
    const component = "climate";
    const objectId = `${CONTROL_OBJECTID_PREFIX}${control.id}`;
    const acSettings = await ACSettings.findOne({
      where: { controlId: control.id },
    });

    let minTemp = 16;
    let maxTemp = 31;
    let fanModes = ["auto", "low", "medium", "high"];
    let defaultTemp = 25;
    try {
      const dict = acSettings?.dictionary;
      minTemp = dict?.limits?.set?.temperature[0] || minTemp;
      maxTemp =
        dict?.limits?.set?.temperature[
          dict?.limits?.set?.temperature?.length - 1
        ] || maxTemp;
      fanModes = dict?.limits?.set?.fan || fanModes;
      defaultTemp = dict?.defaults?.on?.temperature;
    } catch (err) {
      log.error("Error parsing AC dictionary", err);
    }

    const payload = {
      availability_topic: `${MQTT_BRIDGE_PREFIX}/availability/${objectId}`,
      command_topic: `${MQTT_BRIDGE_PREFIX}/climate/command/${objectId}`,
      name: control.name,
      unique_id: `blastbotbridge.${objectId}`,
      object_id: `blastbot_${snakeCase(control.name)}`,
      current_temperature_topic: `${MQTT_BRIDGE_PREFIX}/climate/tempreport/${objectId}`,
      temperature_command_topic: `${MQTT_BRIDGE_PREFIX}/climate/temperature/${objectId}/set`,
      temperature_state_topic: `${MQTT_BRIDGE_PREFIX}/climate/temperature/${objectId}`,
      mode_command_topic: `${MQTT_BRIDGE_PREFIX}/climate/mode/${objectId}/set`,
      mode_state_topic: `${MQTT_BRIDGE_PREFIX}/climate/mode/${objectId}`,
      modes: ["off", "cool"],
      fan_mode_command_topic: `${MQTT_BRIDGE_PREFIX}/climate/fan/${objectId}/set`,
      fan_mode_state_topic: `${MQTT_BRIDGE_PREFIX}/climate/fan/${objectId}`,
      fan_modes: fanModes,
      initial: defaultTemp,
      max_temp: maxTemp,
      min_temp: minTemp,
      precision: 1.0,
      temperature_unit: "C",
      device: await getDiscoveryDeviceDetails(device),
    } as MQTTClimateDiscoveryPayload;
    return { component, objectId, payload };
  }

  startHandlingDeviceEvents() {
    acSettingsService.on("event", async ({ id }) => {
      try {
        const acSettings = await ACSettings.findOne({
          where: { controlId: id },
        });
        const objectId = `${CONTROL_OBJECTID_PREFIX}${id}`;
        this.client.publish(
          `${MQTT_BRIDGE_PREFIX}/climate/temperature/${objectId}`,
          acSettings.temperature,
          { qos: 2, retain: true },
        );
        this.client.publish(
          `${MQTT_BRIDGE_PREFIX}/climate/fan/${objectId}`,
          acSettings.fan,
          { qos: 2, retain: true },
        );
        this.client.publish(
          `${MQTT_BRIDGE_PREFIX}/climate/mode/${objectId}`,
          acSettings.state === "on"
            ? "cool"
            : acSettings.state === "off"
            ? "off"
            : "off",
          { qos: 2, retain: true },
        );
      } catch (err) {
        log.error(
          "HassMqttBridgeService ClimateEntity: Error handling AC event",
          err,
        );
      }
    });
  }

  startHandlingCommands() {
    this.client.subscribe(`${MQTT_BRIDGE_PREFIX}/climate/+/+/set`, {
      qos: 2,
    });
    this.client.on("message", this.handleCommand);
  }

  handleCommand = async (topic: string, payload: Buffer) => {
    // All end with {controlId}/set
    const acSetModeTopicBase = `${MQTT_BRIDGE_PREFIX}/climate/mode/`;
    const acSetTempTopicBase = `${MQTT_BRIDGE_PREFIX}/climate/temperature/`;
    const acSetFanTopicBase = `${MQTT_BRIDGE_PREFIX}/climate/fan/`;

    if (topic.startsWith(acSetModeTopicBase)) {
      const splitted = topic.split("/");
      if (splitted.length < 5) return;
      const objectId = parseInt(
        splitted[3].replace(CONTROL_OBJECTID_PREFIX, ""),
      );
      if (isNaN(objectId)) {
        log.error(
          "HassMqttBridgeService: Invalid controlId Received while handling climate command",
        );
        return;
      }
      const set = splitted[4];
      if (set !== "set") return;
      const mode = payload.toString();
      const command = mode === "off" ? "off" : mode === "cool" ? "on" : "off";
      acSettingsService.emitControl(objectId, { command });
    }

    if (topic.startsWith(acSetTempTopicBase)) {
      const splitted = topic.split("/");
      if (splitted.length < 5) return;
      const objectId = parseInt(
        splitted[3].replace(CONTROL_OBJECTID_PREFIX, ""),
      );
      if (isNaN(objectId)) {
        log.error(
          "HassMqttBridgeService: Invalid controlId Received while handling climate command",
        );
        return;
      }
      const set = splitted[4];
      if (set !== "set") return;
      const temp = parseInt(payload.toString());
      if (isNaN(temp)) {
        log.error(
          "HassMqttBridgeService: Invalid temperature Received while handling climate command",
        );
        return;
      }
      acSettingsService.emitControl(objectId, {
        command: "set",
        options: { temperature: temp.toString() },
      });
    }

    if (topic.startsWith(acSetFanTopicBase)) {
      const splitted = topic.split("/");
      if (splitted.length < 5) return;
      const objectId = parseInt(
        splitted[3].replace(CONTROL_OBJECTID_PREFIX, ""),
      );
      const set = splitted[4];
      if (set !== "set") return;
      if (isNaN(objectId)) {
        log.error(
          "HassMqttBridgeService: Invalid controlId Received while handling climate command",
        );
        return;
      }
      const fan = payload.toString();
      acSettingsService.emitControl(objectId, {
        command: "set",
        options: { fan },
      });
    }
  };
}

const climateEntity = new ClimateEntity();
export default climateEntity;
