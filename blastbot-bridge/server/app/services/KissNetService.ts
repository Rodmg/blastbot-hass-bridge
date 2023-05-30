/*
  KissNetService
    Manages connection with KissNet clients via hubs
*/

import { EventEmitter } from "events";
import { Device } from "@/models/Device";
import { MqttRequester } from "@/libraries/MqttRequest";
import { log } from "@/libraries/Log";
import { Op } from "sequelize";
import mqtt from "mqtt";
import crypto from "crypto";

const CONN_CHECK_INTERVAL = 60000;
// Extra seconds for device duration tolerance
const CONN_DURATION_TOLERANCE_EXTRA = 60;

class KissNetService extends EventEmitter {
  public client: mqtt.Client;
  mqttReq: MqttRequester;

  constructor() {
    super();
  }

  init(client: mqtt.Client) {
    this.client = client;
    this.mqttReq = new MqttRequester(this.client);
    setInterval(() => {
      this.maintainConnections();
    }, CONN_CHECK_INTERVAL);
  }

  maintainConnections() {
    Device.findAll({
      where: {
        [Op.or]: [
          { type: "blastbot-switch" },
          { type: "blastbot-switch-1" },
          { type: "blastbot-switch-3" },
        ],
        bridgeId: { [Op.not]: null },
        connected: true,
        duration: { [Op.not]: null },
        lastSeen: { [Op.not]: null },
      },
    })
      .then((devices: Array<any>) => {
        const now = new Date();
        for (const device of devices) {
          if (
            (now.getTime() - device.lastSeen.getTime()) / 1000 >
            device.duration + CONN_DURATION_TOLERANCE_EXTRA
          ) {
            this.client.publish(`${device.udid}/disconnect`, Buffer.from([]));
          }
        }
      })
      .catch(err => {
        log.error("Kissnet error maintainin", err);
      });
  }

  attendKissNet(topic: string, message: Buffer) {
    //console.log("Kissnet", topic, message);
    const parsedTopic = topic.split("/");
    if (parsedTopic.length < 4) return;
    const bridgeUdid = parsedTopic[0];
    //let kno = parsedTopic[1];
    const addr = parsedTopic[2];
    const action = parsedTopic[3];

    //console.log(bridgeUdid, addr, typeof(addr));

    Device.findOne({
      where: { address: addr },
      include: [{ model: Device, as: "bridge", where: { udid: bridgeUdid } }],
    })
      .then((device: any) => {
        //console.log(action);
        if (device == null) return;

        if (action === "connect")
          return this.client.publish(`${device.udid}/connect`, message);
        if (action === "disconnect")
          return this.client.publish(`${device.udid}/disconnect`, message);
        if (action === "ping") {
          if (!device.connected)
            return this.client.publish(`${device.udid}/connect`, message);
          // update device lastSeen
          device.lastSeen = new Date();
          device.save();
          return;
        }

        if (parsedTopic.length < 5) return;
        const type = parsedTopic[4];

        // republish as device
        this.client.publish(`${device.udid}/${action}/${type}`, message);
      })
      .catch(err => {
        log.error("Kissnet error:", err);
      });
  }

  attendKissNetPair(_udid: string, _message: Buffer) {
    // TODO use this for something?
    //console.log(udid, message.toString());
  }

  sendPair(deviceId: number): Promise<any> {
    return Promise.resolve(
      Device.findOne({
        where: {
          id: deviceId,
          [Op.or]: [
            { type: "blastbot-switch" },
            { type: "blastbot-switch-1" },
            { type: "blastbot-switch-3" },
          ],
          bridgeId: { [Op.not]: null },
        },
        include: [{ model: Device, as: "bridge" }],
      }).then((device: any) => {
        if (device == null) return;
        return this.client.publish(
          `${device.bridge.udid}/knpair/req`,
          String(device.address),
        );
      }),
    );
  }

  attendReq(udid: string, action: string, message: Buffer) {
    // Check if device is bridged
    Device.findOne({
      where: {
        udid: udid,
        [Op.or]: [
          { type: "blastbot-switch" },
          { type: "blastbot-switch-1" },
          { type: "blastbot-switch-3" },
        ],
        bridgeId: { [Op.not]: null },
      },
      include: [{ model: Device, as: "bridge" }],
    })
      .then((device: any) => {
        if (device == null) return;
        // Resend for kissnet
        this.client.publish(
          `${device.bridge.udid}/kni/${device.address}/${action}/req`,
          message,
        );
      })
      .catch(err => {
        log.error("Kissnet error req", err);
      });
  }

  attendHubConfig(device: any): Promise<any> {
    let validConfig = true;
    if (device.config != null) {
      let config: any;
      try {
        config = JSON.parse(device.config);
      } catch (err) {
        log.error("Error parsing KISSnet device config", err);
        validConfig = false;
      }
      if (config.channel == null || isNaN(config.channel) || config.channel > 8)
        validConfig = false;
      if (
        config.key == null ||
        !Array.isArray(config.key) ||
        config.key.length !== 16
      )
        validConfig = false;
      else {
        for (const n of config.key) {
          if (isNaN(n)) validConfig = false;
        }
      }
    } else validConfig = false;

    if (validConfig) return this.sendHubConfig(device);
    else
      return this.generateHubConfig(device).then(device => {
        return this.sendHubConfig(device);
      });
  }

  generateHubConfig(device: any): Promise<any> {
    const channel: number = Math.floor(Math.random() * 8 + 1); // 1 to 8 random channel
    const key: Array<number> = Array.prototype.slice.call(
      crypto.randomBytes(16),
      0,
    );

    const config = {
      address: 0xfe,
      channel: channel,
      key: key,
    };

    device.config = JSON.stringify(config);
    return device.save();
  }

  sendHubConfig(device: any): Promise<any> {
    let parsedCfg: any;

    try {
      parsedCfg = JSON.parse(device.config);
    } catch (err) {
      return Promise.reject(err);
    }

    const config = {
      address: 0xfe,
      channel: parsedCfg.channel,
      key: parsedCfg.key,
    };

    return this.mqttReq.do(`${device.udid}/knconfig`, JSON.stringify(config));
  }
}

const kissNetService = new KissNetService();
export default kissNetService;
