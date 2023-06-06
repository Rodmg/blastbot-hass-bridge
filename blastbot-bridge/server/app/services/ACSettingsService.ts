/*
  ACSettingsService
    ACSettings utilities (emit, emitTest)
 */

import { EventEmitter } from "events";
import _ from "lodash";
import { Control } from "@/models/Control";
import { ACSettings } from "@/models/ACSettings";
import { Device } from "@/models/Device";
import DeviceService from "./DeviceService";
import { log } from "@/libraries/Log";
import blastbotCloudApiService from "./BlastbotCloudApiService";
import axios from "axios";
import { config } from "@/config";

class ACSettingsService extends EventEmitter {
  constructor() {
    super();
  }

  getCode(command: string, control: any, dict: any) {
    // Validations
    if (dict.definitions[command] == null) return null;
    const limits = dict.limits[command];
    const defaults = dict.defaults[command];
    const definition = dict.definitions[command];

    let code = null;

    // Current implementation only supports on, off and set
    if (command === "on") {
      if (typeof definition === "string") code = definition;
    }
    if (command === "off") {
      if (typeof definition === "string") code = definition;
    }
    if (command === "set") {
      // Validate temperature and fan
      if (limits.fan != null) {
        if (limits.fan.indexOf(control.fan) == -1) control.fan = defaults.fan;
      } else return null;
      if (limits.temperature != null) {
        if (limits.temperature.indexOf(control.temperature) == -1)
          control.temperature = defaults.temperature;
      } else return null;

      if (
        typeof definition === "object" &&
        definition.hasOwnProperty(control.temperature) &&
        definition[control.temperature].hasOwnProperty(control.fan) &&
        typeof definition[control.temperature][control.fan] === "string"
      ) {
        code = definition[control.temperature][control.fan];
      }
    }

    return code;
  }

  emitAc(acsettingsId: number, options: any): Promise<any> {
    const promise = ACSettings.findByPk(acsettingsId).then(
      (acSettings: any) => {
        if (!acSettings) throw new Error("No AC Settings found");
        return this.emitControl(acSettings.controlId, options);
      },
    );
    return Promise.resolve(promise);
  }

  updateControl(controlId: number, options: any): Promise<any> {
    const results: any = {};
    const promise = Control.findOne({
      where: { id: controlId },
      include: [{ model: ACSettings, as: "acSettings" }],
    })
      .then((control) => {
        if (!control) throw new Error("No Control found");
        if (!control.acSettings) throw new Error("No AC Settings found");
        let acSettings = control.acSettings;
        results.control = control;
        // Preparing object for DB update
        const dict = control.acSettings.dictionary;
        const pastState = acSettings.state;
        const originalTemp = acSettings.temperature;
        const originalFan = acSettings.fan;
        const limits = control.acSettings.dictionary.limits.set;

        if (options.command === "timer") {
          results.controlUpdate = {
            temperature: acSettings.temperature,
            timer: acSettings.timer,
            mode: acSettings.mode,
            fan: acSettings.fan,
            state: acSettings.state,
            pastState: pastState,
          };
          return Device.findByPk(control.deviceId);
        }

        if (options.command === "toggle") {
          if (pastState === "off") {
            options.command = "on";
          } else if (pastState === "on") {
            options.command = "off";
          }
        }

        if (options.options != null)
          acSettings = _.extend(acSettings, options.options);
        if (options.command === "on" || options.command === "off") {
          acSettings.state = options.command;
          try {
            const defaults = dict.defaults[options.command];
            if (defaults != null) {
              acSettings.temperature = defaults.temperature;
              acSettings.fan = defaults.fan;
            }
          } catch (err) {
            log.error("Error setting default ac settings:", err);
            acSettings.temperature = "25";
            acSettings.fan = "auto";
          }
        }

        if (options.command === "up" || options.command === "down") {
          const method = options.command;
          acSettings.state = "on";
          options.command = "set";

          if (method === "up") {
            acSettings.temperature = (parseInt(originalTemp) + 1).toString();
          }

          if (method === "down") {
            acSettings.temperature = (parseInt(originalTemp) - 1).toString();
          }

          if (limits.temperature.indexOf(acSettings.temperature) === -1) {
            if (method === "up") {
              acSettings.temperature = _.last(limits.temperature).toString();
            }

            if (method === "down") {
              acSettings.temperature = _.first(limits.temperature).toString();
            }
          }
        }

        if (options.command === "fan") {
          let index = limits.fan.indexOf(originalFan) + 1;
          acSettings.state = "on";
          options.command = "set";

          if (index === limits.fan.length) {
            index = 0;
          }
          acSettings.fan = limits.fan[index];
        }

        if (options.command === "set") acSettings.state = "on";

        const controlUpdate = {
          temperature: acSettings.temperature,
          timer: acSettings.timer,
          mode: acSettings.mode,
          fan: acSettings.fan,
          state: acSettings.state,
          pastState: pastState,
          sleepTime: acSettings.state === "off" ? null : acSettings.sleepTime, // Disable sleep on off
        };

        results.controlUpdate = controlUpdate;

        let acSettingsupdate = results.control.acSettings;
        acSettingsupdate = _.merge(acSettingsupdate, results.controlUpdate);
        return acSettingsupdate.save();
      })
      .then((result) => {
        // Emit control event
        this.emit("event", { command: options.command, id: controlId });

        return result;
      })
      .catch((err) => {
        throw err;
      });
    return Promise.resolve(promise);
  }

  emitControl(controlId: number, options: any): Promise<any> {
    const results: any = {};
    const promise = Control.findOne({
      where: { id: controlId },
      include: [{ model: ACSettings, as: "acSettings" }],
    })
      .then((control: Control): any => {
        if (!control) throw new Error("No Control found");
        if (!control.acSettings) throw new Error("No AC Settings found");
        let acSettings = control.acSettings;
        results.control = control;
        // Preparing object for DB update
        const dict = control.acSettings.dictionary;
        const pastState = acSettings.state;
        const originalTemp = acSettings.temperature;
        const originalFan = acSettings.fan;
        const limits = control.acSettings.dictionary.limits.set;

        if (options.command === "timer") {
          results.controlUpdate = {
            temperature: acSettings.temperature,
            timer: acSettings.timer,
            mode: acSettings.mode,
            fan: acSettings.fan,
            state: acSettings.state,
            pastState: pastState,
          };
          return Device.findByPk(control.deviceId);
        }

        if (options.command === "toggle") {
          if (pastState === "off") {
            options.command = "on";
          } else if (pastState === "on") {
            options.command = "off";
          }
        }

        if (options.options != null)
          acSettings = _.extend(acSettings, options.options);
        if (options.command === "on" || options.command === "off") {
          acSettings.state = options.command;
          try {
            const defaults = dict.defaults[options.command];
            if (defaults != null) {
              acSettings.temperature = defaults.temperature;
              acSettings.fan = defaults.fan;
            }
          } catch (err) {
            log.error("Error setting default ac settings:", err);
            acSettings.temperature = "25";
            acSettings.fan = "auto";
          }
        }

        if (options.command === "up" || options.command === "down") {
          const method = options.command;
          acSettings.state = "on";
          options.command = "set";

          if (method === "up") {
            acSettings.temperature = (parseInt(originalTemp) + 1).toString();
          }

          if (method === "down") {
            acSettings.temperature = (parseInt(originalTemp) - 1).toString();
          }

          if (limits.temperature.indexOf(acSettings.temperature) === -1) {
            if (method === "up") {
              acSettings.temperature = _.last(limits.temperature).toString();
            }

            if (method === "down") {
              acSettings.temperature = _.first(limits.temperature).toString();
            }
          }
        }

        if (options.command === "fan") {
          let index = limits.fan.indexOf(originalFan) + 1;
          acSettings.state = "on";
          options.command = "set";

          if (index === limits.fan.length) {
            index = 0;
          }
          acSettings.fan = limits.fan[index];
        }

        if (options.command === "set") acSettings.state = "on";

        const controlUpdate = {
          temperature: acSettings.temperature,
          timer: acSettings.timer,
          mode: acSettings.mode,
          fan: acSettings.fan,
          state: acSettings.state,
          pastState: pastState,
          sleepTime: acSettings.state === "off" ? null : acSettings.sleepTime, // Disable sleep on off
        };

        results.controlUpdate = controlUpdate;

        const code = this.getCode(options.command, controlUpdate, dict);

        return DeviceService.emit(control.deviceId, code);
      })
      .then(() => {
        let acSettings = results.control.acSettings;
        acSettings = _.merge(acSettings, results.controlUpdate);
        return acSettings.save();
      })
      .then((result) => {
        // Emit control event
        this.emit("event", { command: options.command, id: controlId });

        return result;
      })
      .catch((err) => {
        log.error("ACSettingsService: emitControl error:", err);
        throw err;
      });
    return Promise.resolve(promise);
  }

  async emitTest(
    deviceId: number,
    dbControlId: number,
    options: any,
  ): Promise<any> {
    const token = await blastbotCloudApiService.getToken();
    if (token == null) {
      throw new Error(
        "No DB Control found. Invalid Blastbot Cloud credentials.",
      );
    }
    const r = await axios.get(
      `${config.blastbotCloudApi.baseUrl}/api/v3/dbcontrol/${dbControlId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const dbControl = r.data;

    if (!dbControl) throw new Error("No DB Control found");

    let command = "on";

    let opts: any = {
      temperature: "24",
      timer: null,
      mode: null,
      fan: "high",
      state: "on",
      pastState: "off",
    };

    if (options != null) {
      if (options.command != null) command = options.command;
      opts = {
        temperature: options.temperature != null ? options.temperature : "24",
        fan: options.fan != null ? options.fan : "high",
        state: command == "off" ? "off" : "on",
      };
    }

    const dict = dbControl.dictionary;
    const code = this.getCode(command, opts, dict);

    return DeviceService.emit(deviceId, code);
  }
}

const acSettingsService = new ACSettingsService();
export default acSettingsService;
