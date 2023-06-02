import { IRButton } from "@/models/IRButton";
import { DiscoveryData } from "../interfaces";
import { BUTTON_OBJECTID_PREFIX, MQTT_BRIDGE_PREFIX } from "../constants";
import { snakeCase } from "lodash";
import { getDiscoveryDeviceDetails } from "../device";
import { Device } from "@/models/Device";
import mqtt from "mqtt";
import { log } from "@/libraries/Log";
import irButtonService from "@/services/IRButtonService";

class ButtonEntity {
  public client: mqtt.Client;

  init(client: mqtt.Client) {
    this.client = client;
    this.startHandlingCommands(); // Commands from HASS
  }

  async generateDiscoveryData(
    button: IRButton,
    controlName: string,
    device: Device,
  ): Promise<DiscoveryData> {
    const component = "button";
    const objectId = `${BUTTON_OBJECTID_PREFIX}${button.id}`;
    const payload = {
      availability_topic: `${MQTT_BRIDGE_PREFIX}/availability/${objectId}`,
      command_topic: `${MQTT_BRIDGE_PREFIX}/button/command/${objectId}`,
      name: button.name,
      unique_id: `blastbotbridge.${objectId}`,
      object_id: `blastbot_${snakeCase(controlName)}_${snakeCase(button.name)}`,
      device: await getDiscoveryDeviceDetails(device),
    };
    return { component, objectId, payload };
  }

  startHandlingCommands() {
    this.client.subscribe(`${MQTT_BRIDGE_PREFIX}/+/command/+`, {
      qos: 2,
    });
    this.client.on("message", this.handleCommand);
  }

  handleCommand = async (topic: string, _payload: Buffer) => {
    const buttonCommandTopicBase = `${MQTT_BRIDGE_PREFIX}/button/command/`;
    if (topic.startsWith(buttonCommandTopicBase)) {
      const splitted = topic.split("/");
      if (splitted.length < 4) return;
      const objectId = splitted[3];
      const buttonId = parseInt(objectId.replace(BUTTON_OBJECTID_PREFIX, ""));
      if (isNaN(buttonId)) {
        log.error(
          "HassMqttBridgeService: Invalid buttonId Received while handling button command",
        );
        return;
      }
      try {
        await irButtonService.emitButton(buttonId);
      } catch (err) {
        log.error("ButtonEntity: handleCommand error:", err);
      }
    }
  };
}

const buttonEntity = new ButtonEntity();
export default buttonEntity;
