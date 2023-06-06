import { Device } from "@/models/Device";
import mqtt from "mqtt";
import { DiscoveryData, MQTTSensorDiscoveryPayload } from "../interfaces";
import { DEVICE_OBJECTID_PREFIX, MQTT_BRIDGE_PREFIX } from "../constants";
import { snakeCase } from "lodash";
import { getDiscoveryDeviceDetails } from "../device";
import MqttClient from "@/services/MqttClient";
import { log } from "@/libraries/Log";

class SensorEntity {
  public client: mqtt.Client;

  init(client: mqtt.Client) {
    this.client = client;
    this.startHandlingDeviceEvents(); // State changes
  }

  async generateDiscoveryData(device: Device): Promise<DiscoveryData> {
    const component = "sensor";
    const objectId = `${DEVICE_OBJECTID_PREFIX}${device.id}`;
    const payload: MQTTSensorDiscoveryPayload = {
      availability_topic: `${MQTT_BRIDGE_PREFIX}/availability/${objectId}`,
      state_topic: `${MQTT_BRIDGE_PREFIX}/sensor/state/${objectId}`,
      state_class: "measurement",
      unit_of_measurement: "ºC",
      device_class: "temperature",
      name: `${device.name} temperature`,
      unique_id: `blastbotbridge.${objectId}`,
      object_id: `blastbot_${snakeCase(device.name)}_temperature`,
      device: await getDiscoveryDeviceDetails(device),
    };
    return { component, objectId, payload };
  }

  startHandlingDeviceEvents() {
    MqttClient.on("temp/rep", async (data) => {
      const udid: string = data.udid;
      const temp: number = parseFloat(data.message.toString());
      if (temp == null || isNaN(temp)) return;

      try {
        const device = await Device.findOne({ where: { udid } });
        if (!device) return;
        const objectId = `${DEVICE_OBJECTID_PREFIX}${device.id}`;
        this.client.publish(
          `${MQTT_BRIDGE_PREFIX}/sensor/state/${objectId}`,
          temp.toString(),
          { qos: 2, retain: true },
        );
      } catch (err) {
        log.error("SensorEntity: Error getting device for reporting temp", err);
      }
    });
  }
}

const sensorEntity = new SensorEntity();
export default sensorEntity;
