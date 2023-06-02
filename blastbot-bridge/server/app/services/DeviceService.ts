/*
  DeviceService
    Device utilities (emit, learn, temperature)
 */

import { Device } from "@/models/Device";
import { MqttRequester } from "@/libraries/MqttRequest";
import MqttClient from "./MqttClient";
import KissNetService from "./KissNetService";
import SensorService from "./SensorService";
import { log } from "@/libraries/Log";

class DeviceService {
  mqttReq: MqttRequester;

  init() {
    this.mqttReq = MqttClient.mqttReq;
  }

  requestVersion(id: number): Promise<string> {
    const results: any = {};

    const promise = Device.findByPk(id)
      .then(device => {
        if (!device) throw new Error("No device found");
        results.device = device;
        const udid = device.udid;
        return this.mqttReq.do(`${udid}/info`);
      })
      .then(data => {
        const parsed: any = JSON.parse(data);
        const device = results.device;
        if (parsed.version != null) {
          results.version = parsed.version;
          device.version = parsed.version;
        }
        if (parsed.v != null) {
          results.version = parsed.v;
          device.version = parsed.v;
        }
        // Set/correct device type (used for Blastbot Hub)
        if (parsed.type != null) {
          results.type = parsed.type;
          device.type = parsed.type;
        }
        if (parsed.t != null) {
          if (parsed.t === "bb-sw") parsed.t = "blastbot-switch";
          if (parsed.t === "bb-sw1") parsed.t = "blastbot-switch-1";
          if (parsed.t === "bb-sw3") parsed.t = "blastbot-switch-3";
          results.type = parsed.t;
          device.type = parsed.t;
        }
        device.information = JSON.stringify(parsed);

        return device.save();
      })
      .then(device => {
        results.device = device;
        if (device != null && device.type === "blastbot-hub") {
          return KissNetService.attendHubConfig(device);
        }
        return null;
      })
      .then(() => {
        return results.device;
      })
      .catch(err => {
        log.error("DeviceService: requestVersion error:", err);
      });

    return Promise.resolve(promise);
  }

  emit(id: number, code: string, type = "ir"): Promise<string> {
    if (code == null) return Promise.reject(new Error("Invalid code"));

    const promise = Device.findByPk(id).then(device => {
      if (!device) throw new Error("No device found");
      const udid = device.udid;
      if (type === "ir") return this.mqttReq.do(`${udid}/emit`, code);
      else if (type === "rf") return this.mqttReq.do(`${udid}/ook`, code);
      else throw new Error("Invalid code type: " + type);
    });

    return Promise.resolve(promise);
  }

  learn(id: number): Promise<string> {
    const promise = Device.findByPk(id).then(device => {
      if (!device) throw new Error("No device found");
      const udid = device.udid;
      return this.mqttReq.do(`${udid}/learn`);
    });

    return Promise.resolve(promise);
  }

  learnRf(id: number): Promise<string> {
    const promise = Device.findByPk(id).then(device => {
      if (!device) throw new Error("No device found");
      if (!device.hasRf()) throw new Error("Device doesn't have RF");

      const udid = device.udid;
      return new Promise<string>((resolve, reject) => {
        const resTopic = `${udid}/ook/rep`;
        let tout = null;
        const confirmCb = (code: string) => {
          if (tout) {
            clearTimeout(tout);
            SensorService.removeListener(resTopic, confirmCb);
            return resolve(code);
          }
        };
        tout = setTimeout(() => {
          tout = null;
          SensorService.removeListener(resTopic, confirmCb);
          return reject(new Error("Learn RF Timeout"));
        }, 10000);
        SensorService.once(resTopic, confirmCb);
      });
    });

    return Promise.resolve(promise);
  }

  temperature(id: number): Promise<number> {
    const promise = Device.findByPk(id)
      .then(device => {
        if (!device) throw new Error("No device found");
        const udid = device.udid;
        return this.mqttReq.do(`${udid}/temp`);
      })
      .then(data => {
        return parseFloat(data);
      });

    return Promise.resolve(promise);
  }

  getInformation(device: any): Promise<any> {
    if (device == null) Promise.reject(new Error("No device found"));

    const udid = device.udid;
    const promise = this.mqttReq.do(`${udid}/info`).then(data => {
      if (!data) throw new Error("No info found");

      const parsed: any = JSON.parse(data);
      device.information = JSON.stringify(parsed);

      return device.save();
    });

    return Promise.resolve(promise);
  }

  action(device: any, action: string, data?: string): Promise<any> {
    if (device == null) Promise.reject(new Error("No device found"));
    const udid = device.udid;
    if (udid == null) Promise.reject(new Error("No udid found"));
    return this.mqttReq.do(`${udid}/${action}`, data);
  }
}

const deviceService = new DeviceService();
export default deviceService;
