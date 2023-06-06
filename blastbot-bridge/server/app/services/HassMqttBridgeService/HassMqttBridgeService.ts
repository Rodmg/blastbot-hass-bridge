/*
  HassMqttBridgeService
    Integration with Home Assistant via its MQTT Discovery feature.
 */
import { Control } from "@/models/Control";
import { Device } from "@/models/Device";
import { IRButton } from "@/models/IRButton";
import mqtt from "mqtt";
import MqttClient from "@/services/MqttClient";
import { log } from "@/libraries/Log";
import { db } from "@/db";
import { DiscoveryData } from "./interfaces";
import {
  BUTTON_OBJECTID_PREFIX,
  CONTROL_OBJECTID_PREFIX,
  DEVICE_OBJECTID_PREFIX,
  MQTT_BRIDGE_PREFIX,
  MQTT_HASS_PREFIX,
} from "./constants";
import buttonEntity from "./entityTypes/ButtonEntity";
import climateEntity from "./entityTypes/ClimateEntity";
import switchEntity from "./entityTypes/SwitchEntity";
import { debounce } from "lodash";
import sensorEntity from "./entityTypes/SensorEntity";
import hassWsApi from "../HassWsApi";

const DEVICE_TYPES_THAT_REQUIRE_AUTH = [
  "blastbot-ir",
  "blastbot-hub",
  "blastbot-plug",
];

class HassMqttBridgeService {
  private client: mqtt.Client;

  init(client: mqtt.Client) {
    this.client = client;

    // On device connected, search all it's controls and publishDiscovery for them
    MqttClient.on("deviceConnected", this.handleDeviceConnected);
    MqttClient.on("deviceDisconnected", this.handleDeviceDisconnected);

    // Handle removals
    db.addHook("afterDestroy", this.handleDbDestroy);

    // Handle creations
    db.addHook("afterCreate", this.handleDbCreate);

    // Handle changes, we only care for name changes for buttons and controls
    db.addHook("afterUpdate", this.handleDbUpdate);

    // Handle Entity events and commands
    switchEntity.init(client);
    climateEntity.init(client);
    buttonEntity.init(client);
    sensorEntity.init(client);

    this.reportDiscoveryAll();
  }

  handleDeviceConnected = async (device: Device) => {
    try {
      const controls = await Control.findAll({
        where: { deviceId: device.id },
      });
      controls.forEach((control) => this.reportDiscovery(control, true));
      this.reportDiscoveryDevice(device, true);
    } catch (err) {
      log.error("Error on deviceConnected in HassMqttBridgeService", err);
    }
  };

  handleDeviceDisconnected = async (device: Device) => {
    try {
      const controls = await Control.findAll({
        where: { deviceId: device.id },
      });
      controls.forEach((control) => this.reportOffline(control));
      this.reportOfflineDevice(device);
    } catch (err) {
      log.error("Error on deviceConnected in HassMqttBridgeService", err);
    }
  };

  handleDbDestroy = async (instance: any, _options: any) => {
    const model = instance._modelOptions.name.singular;

    if (model === "Control") {
      let component = "";
      let objectId = "";
      switch ((instance as Control).type) {
        case "ir":
          component = "button";
          const buttons = await IRButton.findAll({
            where: { controlId: instance.id },
          });
          for (const button of buttons) {
            const objectId = `${BUTTON_OBJECTID_PREFIX}${button.id}`;
            this.publishDeletion(component, objectId);
          }
          break;
        case "ac":
          component = "climate";
          objectId = `${CONTROL_OBJECTID_PREFIX}${instance.id}`;
          this.publishDeletion(component, objectId);
          break;
        case "switch":
          component = "switch";
          objectId = `${CONTROL_OBJECTID_PREFIX}${instance.id}`;
          this.publishDeletion(component, objectId);
          break;
      }
    }

    if (model === "IRButton") {
      const component = "button";
      const objectId = `${BUTTON_OBJECTID_PREFIX}${instance.id}`;
      this.publishDeletion(component, objectId);
    }

    if (model === "Device") {
      const devicesOfInterest = ["blastbot-ir", "blastbot-hub"];
      if (!devicesOfInterest.includes(instance.type)) return;
      const component = "sensor";
      const objectId = `${DEVICE_OBJECTID_PREFIX}${instance.id}`;
      this.publishDeletion(component, objectId);
    }

    // Handle removing HASS User for Devices that require MQTT auth
    if (
      model === "Device" &&
      DEVICE_TYPES_THAT_REQUIRE_AUTH.includes(instance.type)
    ) {
      hassWsApi.deleteDeviceUser(instance.udid);
    }
  };

  handleDbCreate = async (instance: any, _options: any) => {
    const model = instance._modelOptions.name.singular;

    const modelsOfInterest = ["Control", "IRButton", "Device"];

    if (modelsOfInterest.includes(model)) {
      // This applies to button, climate and switch
      // Please note: potential race condition (as switches, IRButtons, etc, could be created after the control is created)
      // We are relying on the reportDiscoveryAll debounce delay for this...
      this.reportDiscoveryAll();
    }

    // Handle creating HASS User for Devices that require MQTT auth
    if (
      model === "Device" &&
      DEVICE_TYPES_THAT_REQUIRE_AUTH.includes(instance.type)
    ) {
      hassWsApi.createDeviceUser(instance.name, instance.udid, instance.token);
    }
  };

  handleDbUpdate = async (instance: any, _options: any) => {
    const model = instance._modelOptions.name.singular;
    const changed = instance._changed;

    const modelsOfInterest = ["Control", "IRButton", "Device"];

    if (modelsOfInterest.includes(model) && changed.hasOwnProperty("name")) {
      this.reportDiscoveryAll();
      // Handle updating Device User name in HASS
      if (
        model === "Device" &&
        DEVICE_TYPES_THAT_REQUIRE_AUTH.includes(instance.type)
      ) {
        hassWsApi.updateDeviceUserName(instance.udid, instance.name);
      }
    }
  };

  async reportDiscovery(control: Control, online: boolean) {
    const device = await Device.findByPk(control.deviceId);

    if (control.type === "ir") {
      const buttons = await IRButton.findAll({
        where: { controlId: control.id },
      });
      for (const button of buttons) {
        const data = await buttonEntity.generateDiscoveryData(
          button,
          control.name,
          device,
        );
        this.publishDiscovery(data);
        this.publishAvailability(data.objectId, online);
      }
    }

    if (control.type === "ac") {
      const data = await climateEntity.generateDiscoveryData(control, device);
      this.publishDiscovery(data);
      this.publishAvailability(data.objectId, online);
    }

    if (control.type === "switch") {
      const data = await switchEntity.generateDiscoveryData(control, device);
      this.publishDiscovery(data);
      this.publishAvailability(data.objectId, online);
    }
  }

  async reportDiscoveryDevice(device: Device, online: boolean) {
    const devicesOfInterest = ["blastbot-ir", "blastbot-hub"];
    if (!devicesOfInterest.includes(device.type)) return;
    const data = await sensorEntity.generateDiscoveryData(device);
    this.publishDiscovery(data);
    this.publishAvailability(data.objectId, online);
  }

  async reportOffline(control: Control) {
    switch (control.type) {
      case "ir":
        const buttons = await IRButton.findAll({
          where: { controlId: control.id },
        });
        for (const button of buttons) {
          const objectId = `${BUTTON_OBJECTID_PREFIX}${button.id}`;
          this.publishAvailability(objectId, false);
        }
        break;
      case "ac":
      case "switch":
        const objectId = `${CONTROL_OBJECTID_PREFIX}${control.id}`;
        this.publishAvailability(objectId, false);
        break;
    }
  }

  async reportOfflineDevice(device: Device) {
    const devicesOfInterest = ["blastbot-ir", "blastbot-hub"];
    if (!devicesOfInterest.includes(device.type)) return;
    const objectId = `${DEVICE_OBJECTID_PREFIX}${device.id}`;
    this.publishAvailability(objectId, false);
  }

  // publish the discovery and availability messages for all known devices
  async reportDiscoveryAllImmediately() {
    log.info("Reporting discovery all");
    try {
      const controls = await Control.findAll({ include: [Device] });
      for (const control of controls) {
        this.reportDiscovery(control, control.device.connected);
      }
      const devices = await Device.findAll();
      for (const device of devices) {
        this.reportDiscoveryDevice(device, device.connected);
      }
    } catch (err) {
      log.error("HassMqttBridgeService: Error on reportDiscoveryAll", err);
    }
  }

  reportDiscoveryAll = debounce(this.reportDiscoveryAllImmediately, 2000);

  publishAvailability(objectId: string, connected: boolean) {
    const payload = connected ? "online" : "offline";
    this.client.publish(
      `${MQTT_BRIDGE_PREFIX}/availability/${objectId}`,
      payload,
      { qos: 2, retain: true },
    );
  }

  publishDiscovery(data: DiscoveryData) {
    const { component, objectId, payload } = data;
    const prefix = MQTT_HASS_PREFIX;

    this.client.publish(
      `${prefix}/${component}/${objectId}/config`,
      JSON.stringify(payload),
      { qos: 2, retain: true },
    );
  }

  publishDeletion(component: string, objectId: string) {
    const prefix = MQTT_HASS_PREFIX;

    this.client.publish(
      `${prefix}/${component}/${objectId}/config`,
      JSON.stringify({}),
      { qos: 2, retain: true },
    );
  }
}

const hassMqttBridgeService = new HassMqttBridgeService();
export default hassMqttBridgeService;
