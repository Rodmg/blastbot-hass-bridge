/*
  SensorService
    Manages sensor events
 */

import { EventEmitter } from "events";
import { Device } from "@/models/Device";
import { Op } from "sequelize";
import MqttClient from "./MqttClient";
import { log } from "@/libraries/Log";

class SensorService extends EventEmitter {
  constructor() {
    super();
  }

  init() {
    // Manage ook events
    MqttClient.on("ook/rep", (data) => {
      const udid: string = data.udid;
      const code: string = data.message.toString("utf8");
      /*
        Format:
        [frecuency with one decimal * 10],[protocol number],[bit lenght],[message number]
        Example:
        4339,1,24,3823700
      */
      const codeItems: Array<string> = code.split(",");
      if (codeItems.length < 4) return; // Invalid data
      const frequency: number = parseInt(codeItems[0]);
      const protocol: number = parseInt(codeItems[1]);
      const bitlen: number = parseInt(codeItems[2]);
      const rfcode: number = parseInt(codeItems[3]);
      if (isNaN(frequency) || isNaN(protocol) || isNaN(bitlen) || isNaN(rfcode))
        return; // Bad data

      log.debug("Got OOK Code:", code);
      // Emit raw code for learning and other internal uses
      this.emit(`${udid}/ook/rep`, code);

      Device.findOne({
        where: {
          mac: code,
          [Op.or]: [
            { type: "virtual-pir" },
            { type: "virtual-door" },
            { type: "virtual-button" },
          ],
        },
        include: [
          {
            model: Device,
            as: "bridge",
            where: { udid: udid },
            required: true,
          },
        ],
      })
        .then((virtualdevice: any) => {
          if (!virtualdevice) throw null;
          if (!virtualdevice.connected) {
            virtualdevice.connected = true;
            virtualdevice.state = "connected";
            virtualdevice.save();
          }
          switch (virtualdevice.type) {
            case "virtual-pir":
              this.manageVirtualPir(virtualdevice);
              break;
            case "virtual-door":
              this.emit("event", {
                type: "virtual-door",
                id: virtualdevice.id,
                event: "open",
              });
              break;
            case "virtual-button":
              this.emit("event", {
                type: "virtual-button",
                id: virtualdevice.id,
                event: "pressed",
              });
              break;
          }
        })
        .catch((err) => {
          if (err) return log.error(err);
        });
    });

    // Handle no-presence events on pir
    setInterval(() => {
      this.handlePirNoPresence();
    }, 10000);
  }

  manageVirtualPir(virtualdevice: any) {
    let config: any = {};
    try {
      config = JSON.parse(virtualdevice.config);
    } catch (err) {
      log.error("Error parsing JSON of virtual-pir.", err);
      return;
    }

    /*
      config format:
      {
        'presenceDelay': 0,
        'noPresenceDelay': 30,
        'presence': false,
        'lastPresence': null
      }
    */
    if (!config) config = {};
    if (config.presenceDelay == null) config.presenceDelay = 0;
    if (config.noPresenceDelay == null) config.noPresenceDelay = 30;
    config.presence = true;

    if (config.presence === true) {
      config.lastPresence = new Date();
      this.emit("event", {
        type: "virtual-pir",
        id: virtualdevice.id,
        event: "presence",
      });
    }

    try {
      virtualdevice.config = JSON.stringify(config);
    } catch (err) {
      log.error("Error stringifying JSON of virtual-pir.", err);
      return;
    }

    virtualdevice.save();
  }

  handlePirNoPresence() {
    Device.findAll({ where: { type: "virtual-pir" } })
      .then((results: any) => {
        if (!results.length) return;
        const now = new Date();

        results.forEach((device) => {
          let newConfig;
          try {
            newConfig = JSON.parse(device.config);
          } catch (err) {
            log.error("Error parsing JSON of virtual-pir.", err);
            return;
          }
          if (
            newConfig.presence === true &&
            now.getTime() - new Date(newConfig.lastPresence).getTime() >
              newConfig.noPresenceDelay * 1000
          ) {
            this.emit("event", {
              type: "virtual-pir",
              id: device.id,
              event: "no-presence",
            });
            newConfig.presence = false;
            try {
              device.config = JSON.stringify(newConfig);
            } catch (err) {
              log.error("Error stringifying JSON of virtual-pir.", err);
              return;
            }
            device.save();
          }
        });
      })
      .catch((err) => {
        log.error(err);
      });
  }
}

const sensorService = new SensorService();
export default sensorService;
