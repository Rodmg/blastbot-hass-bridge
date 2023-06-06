/*
  MqttClient
    Manages connection with devices via MQTT broker
*/

import { EventEmitter } from "events";
import mqtt from "mqtt";
import { log } from "@/libraries/Log";
import { config } from "@/config";
import { Device } from "@/models/Device";
import { MqttRequester } from "@/libraries/MqttRequest";
import DeviceService from "./DeviceService";
import KissNetService from "./KissNetService";
import HassMqttBridgeService from "./HassMqttBridgeService";

class MqttClient extends EventEmitter {
  public client: mqtt.Client;
  public mqttReq: MqttRequester;

  constructor() {
    super();
  }

  init() {
    const options: mqtt.IClientOptions = {
      keepalive: config.mqtt.keepalive,
      username: config.mqtt.user,
      connectTimeout: config.mqtt.connectTimeout,
      password: config.mqtt.password,
      clientId: config.mqtt.clientId,
    };

    this.client = mqtt.connect(config.mqtt.uri, options);

    KissNetService.init(this.client);
    HassMqttBridgeService.init(this.client);

    this.mqttReq = new MqttRequester(this.client);

    this.client.on("connect", () => {
      this.client.subscribe("+/connect");
      this.client.subscribe("+/disconnect");
      this.client.subscribe("+/+/res");
      this.client.subscribe("+/+/rep");

      // KISSnet
      this.client.subscribe("+/kno/+/#");
      this.client.subscribe("+/kno/+/#");
      this.client.subscribe("+/+/req");

      log.info("MqttClient Online");
    });

    this.client.on("error", (error) => {
      log.error("MqttClient error:", error);
      throw new Error("MqttClient failed to connect, forcing restart...");
    });

    this.client.on("offline", () => {
      log.error("MqttClient Offline!");
    });

    this.client.on("reconnect", () => {
      log.debug("MqttClient trying to reconnect");
    });

    this.client.on("close", () => {
      log.debug("MqttClient connection closed");
    });

    this.client.on("message", (topic, message) => {
      const parsedTopic = topic.split("/");
      const udid = parsedTopic[0];
      const action = parsedTopic[1];
      const type = parsedTopic[2];

      // Special case for KISSnet messages
      if (action === "kno") return KissNetService.attendKissNet(topic, message);
      if (action === "knpair" && type === "rep")
        return KissNetService.attendKissNetPair(udid, message);

      //const isResponse = type === "res";
      const isReport = type === "rep";

      if (action === "connect") return this.onDeviceConnected(udid, message);
      if (action === "disconnect")
        return this.onDeviceDisconnected(udid, message);

      if (isReport) {
        // Emit report
        this.emit("rep", { action: action, udid: udid, message: message });
        this.emit(`${action}/rep`, { udid: udid, message: message });
      }

      if (type === "req") {
        // Check if needs to be resent to bridge
        KissNetService.attendReq(udid, action, message);
      }
    });
  }

  onDeviceConnected(udid: string, message: any) {
    if (!udid) return;

    let isFirstConnection = false;

    Device.findOne({ where: { udid: udid } })
      .then((device) => {
        if (!device) return Promise.reject(`No device found with udid ${udid}`);

        // Validate first connection
        if (!device.loggedAt) {
          isFirstConnection = true;
          // Change generic name for new devices
          if (device.name === "Nuevo Blastbot" || device.name.length === 0) {
            if (device.mac != null && device.mac.length === 12) {
              device.name = "Blastbot " + device.mac.substring(8);
            }
            if (
              device.type === "blastbot-switch" ||
              device.type === "blastbot-switch-1" ||
              device.type === "blastbot-switch-3"
            ) {
              device.name = `Blastbot Switch ${device.address}`;
            }
            if (device.type === "blastbot-plug" && device.mac?.length === 12) {
              device.name = "Blastbot Plug " + device.mac.substring(8);
            }
            if (device.type === "blastbot-hub" && device.mac?.length === 12) {
              device.name = "Blastbot Hub " + device.mac.substring(8);
            }
          }
          device.loggedAt = new Date();
        }

        if (
          device.type === "blastbot-switch" ||
          device.type === "blastbot-switch-1" ||
          device.type === "blastbot-switch-3"
        ) {
          const duration = parseInt(message);
          if (!isNaN(duration)) device.duration = duration;
        }

        device.connected = true;
        device.state = "connected";
        device.lastSeen = new Date();
        return device.save();
      })
      .then((updated) => {
        if (!updated) return Promise.reject(`Device not updated ${udid}`);
        const device = updated;

        // Give time for the connection to settle before requesting version
        // (For all the necessary subscriptions to be made)
        setTimeout(() => {
          DeviceService.requestVersion(device.id)
            .then((device) => {
              this.emit("deviceConnected", device);
              if (isFirstConnection) this.emit("deviceFirstConnection", device);
            })
            .catch((err) => {
              // TODO: Retry requesting version with extra timeout of 1s?
              // Sometimes a device reconnects and this fails, so the device connection is not saved in the log
              // Or just emit 'deviceConnected' anyway?
              if (!isFirstConnection) this.emit("deviceConnected", updated);
              if (err) log.debug("Error requesting device version.", err);
            });
        }, 2000);

        return Promise.resolve(device);
      })
      .catch((err) => {
        if (err) return log.debug(err);
      });
  }

  onDeviceDisconnected(udid: string, _message: any) {
    if (!udid) return;

    Device.findOne({ where: { udid: udid } })
      .then((device) => {
        if (!device) {
          log.debug(`No device found with udid ${udid}`);
          throw null;
        }

        device.connected = false;
        device.state = "lost";
        device.lastSeen = new Date();

        return device.save();
      })
      .then((device) => {
        if (!device) {
          log.debug(`Device not updated, udid: ${udid}`);
          throw null;
        }
        this.emit("deviceDisconnected", device);
        return Device.findAll({ where: { bridgeId: device.id } });
      })
      .then((devices: Array<any>) => {
        if (devices)
          devices.forEach((device) => {
            this.client.publish(`${device.udid}/disconnect`, Buffer.from([]));
          });
      })
      .catch((err) => {
        if (err) return log.error(err);
      });
  }

  publish(topic, payload) {
    this.client.publish(topic + "/req", payload);
  }
}

const mqttClient = new MqttClient();
export default mqttClient;
