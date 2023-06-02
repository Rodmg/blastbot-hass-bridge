import { DiscoveryData, MQTTSwitchDiscoveryPayload } from "../interfaces";
import { CONTROL_OBJECTID_PREFIX, MQTT_BRIDGE_PREFIX } from "../constants";
import { snakeCase } from "lodash";
import { getDiscoveryDeviceDetails } from "../device";
import { Device } from "@/models/Device";
import { Control } from "@/models/Control";
import mqtt from "mqtt";
import switchService from "@/services/SwitchService";
import { log } from "@/libraries/Log";
import { Switch } from "@/models/Switch";

class SwitchEntity {
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
    const component = "switch";
    const objectId = `${CONTROL_OBJECTID_PREFIX}${control.id}`;
    const payload = {
      availability_topic: `${MQTT_BRIDGE_PREFIX}/availability/${objectId}`,
      command_topic: `${MQTT_BRIDGE_PREFIX}/switch/command/${objectId}`,
      state_topic: `${MQTT_BRIDGE_PREFIX}/switch/state/${objectId}`,
      name: control.name,
      unique_id: `blastbotbridge.${objectId}`,
      object_id: `blastbot_${snakeCase(control.name)}`,
      device: await getDiscoveryDeviceDetails(device),
    } as MQTTSwitchDiscoveryPayload;
    return { component, objectId, payload };
  }

  startHandlingDeviceEvents() {
    switchService.on("event", ({ id, command }) => {
      if (command !== "on" && command !== "off") {
        return;
      }
      const objectId = `${CONTROL_OBJECTID_PREFIX}${id}`;
      this.client.publish(
        `${MQTT_BRIDGE_PREFIX}/switch/state/${objectId}`,
        command.toUpperCase(),
        { qos: 2, retain: true },
      );
    });
  }

  startHandlingCommands() {
    this.client.subscribe(`${MQTT_BRIDGE_PREFIX}/+/command/+`, {
      qos: 2,
    });
    this.client.on("message", this.handleCommand);
  }

  handleCommand = async (topic: string, payload: Buffer) => {
    const switchCommandTopicBase = `${MQTT_BRIDGE_PREFIX}/switch/command/`;
    if (topic.startsWith(switchCommandTopicBase)) {
      const splitted = topic.split("/");
      if (splitted.length < 4) return;
      const objectId = splitted[3];
      const controlId = parseInt(objectId.replace(CONTROL_OBJECTID_PREFIX, ""));
      if (isNaN(controlId)) {
        log.error(
          "HassMqttBridgeService: Invalid controlId Received while handling switch command",
        );
        return;
      }
      try {
        const sw = await Switch.findOne({ where: { controlId } });
        await switchService.execute(sw.id, {
          command: payload.toString().toLowerCase(),
        });
      } catch (err) {
        log.error("SwitchEntity: handleCommand error:", err);
      }
    }
  };
}

const switchEntity = new SwitchEntity();
export default switchEntity;
