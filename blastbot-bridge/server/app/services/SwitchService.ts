/*
  SwitchService
    Switch utilities (emit, emitTest)
 */

import { EventEmitter } from "events";
import { Control } from "@/models/Control";
import { Device } from "@/models/Device";
import { Switch } from "@/models/Switch";
import DeviceService from "./DeviceService";
import MqttClient from "./MqttClient";
import { MqttRequester } from "@/libraries/MqttRequest";
import { log } from "@/libraries/Log";

class SwitchService extends EventEmitter {
  mqttReq: MqttRequester;

  constructor() {
    super();
  }

  init() {
    // Manage manual status changes from device

    this.mqttReq = MqttClient.mqttReq;

    MqttClient.on("status/rep", data => {
      const udid: string = data.udid;
      let body: any;
      try {
        body = JSON.parse(data.message.toString());
      } catch (err) {
        return log.error("Error parsing status rep:", err);
      }

      Control.findAll({
        include: [
          {
            model: Device,
            as: "device",
            where: { udid: udid },
            required: true,
          },
          { model: Switch, as: "switches" },
        ],
      })
        .then((controls: any) => {
          for (const control of controls) {
            for (const sw of control.switches) {
              if (body[sw.name] != null && sw.state != body[sw.name]) {
                // only if changed. != important
                sw.state = body[sw.name];
                sw.save();
                // Emit control event
                this.emit("event", {
                  id: sw.controlId,
                  command: sw.state ? "on" : "off",
                });
                // Also emit toggle event
                this.emit("event", { id: sw.controlId, command: "toggle" });
              }
            }
          }
          return;
        })
        .catch(err => {
          log.error(err);
        });
    });

    // Send last state to newly connected device
    MqttClient.on("deviceConnected", async device => {
      if (
        device.type !== "blastbot-plug" &&
        device.type !== "blastbot-switch" &&
        device.type !== "blastbot-switch-1" &&
        device.type !== "blastbot-switch-3"
      )
        return;

      try {
        const controls = await Control.findAll({
          include: [
            {
              model: Device,
              as: "device",
              where: { id: device.id },
              required: true,
            },
            { model: Switch, as: "switches" },
          ],
        });

        // Try to restore previous state if last connection is recent enough
        const hour = 60 * 60 * 1000;
        const staleTime = 1 * hour;
        const now = new Date();
        if (now.getTime() - device.lastSeen.getTime() < staleTime) {
          // Prepare data to send
          const data = {};
          for (const control of controls) {
            if (!control.switches.length) continue;
            const sw = control.switches[0];
            data[sw.name] = sw.state;
          }

          // Emit
          await DeviceService.action(device, "set", JSON.stringify(data));
        }

        // End Try to restore previous state

        const data = await this.mqttReq.do(`${device.udid}/status`);

        const states = JSON.parse(data.toString());
        let promises;

        /**
         * we know we have Control -> [Switches],
         * but it really works Control -> [Switch]
         */
        controls.forEach((control: any) => {
          promises = control.switches.map((sw: any) => {
            return sw.update({ state: states[sw.name] }, { fields: ["state"] });
          });
        });

        await Promise.all(promises);
      } catch (err) {
        log.debug(err);
      }
    });

    // Create default control on first connection
    MqttClient.on("deviceFirstConnection", device => {
      if (device.type === "blastbot-plug") {
        Control.create({
          type: "switch",
          name: device.name,
          icon: "bb-plug",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw1",
            order: 0,
            controlId: control.id,
          });
        });
      }
      if (device.type === "blastbot-switch") {
        Control.create({
          type: "switch",
          name: device.name + " A",
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw1",
            order: 0,
            controlId: control.id,
          });
        });
        Control.create({
          type: "switch",
          name: device.name + " B",
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw2",
            order: 0,
            controlId: control.id,
          });
        });
      }
      if (device.type === "blastbot-switch-1") {
        Control.create({
          type: "switch",
          name: device.name,
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw1",
            order: 0,
            controlId: control.id,
          });
        });
      }
      if (device.type === "blastbot-switch-3") {
        Control.create({
          type: "switch",
          name: device.name + " A",
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw1",
            order: 0,
            controlId: control.id,
          });
        });
        Control.create({
          type: "switch",
          name: device.name + " B",
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw2",
            order: 0,
            controlId: control.id,
          });
        });
        Control.create({
          type: "switch",
          name: device.name + " C",
          icon: "bb-touch",
          deviceId: device.id,
        }).then((control: any) => {
          return Switch.create({
            name: "sw3",
            order: 0,
            controlId: control.id,
          });
        });
      }
    });
  }

  updateSwitch(switchId: number, options: any): Promise<any> {
    const results: any = {};
    const promise = Switch.findOne({
      where: { id: switchId },
      include: [
        {
          model: Control,
          as: "control",
          include: [{ model: Device, as: "device" }],
        },
      ],
    })
      .then((sw: any) => {
        if (!sw) throw new Error("No Switch found");
        results.sw = sw;

        let state = sw.state;
        const cmd = options.command;
        if (cmd === "on") state = true;
        else if (cmd === "off") state = false;
        else if (cmd === "toggle") state = !state;
        else throw new Error("Invalid command for switch");
        // Check if this is a toggle
        results.changed = false;
        if (sw.state !== state) results.changed = true;
        // Prepare object for DB update
        results.update = {
          state: state,
        };
        // Prepare data to send
        const data = {};
        data[sw.name] = state;
        results.sw.state = results.update.state;
        return results.sw.save();
      })
      .then(result => {
        // Append switch name to results
        results.update.name = results.sw.name;
        // Emit control event
        this.emit("event", {
          id: results.sw.controlId,
          command: results.sw.state ? "on" : "off",
        });
        // Also emit toggle event if state changed TODO check change
        if (results.changed)
          this.emit("event", { id: results.sw.controlId, command: "toggle" });
        return result;
      })
      .catch(err => {
        throw err;
      });
    return Promise.resolve(promise);
  }

  execute(switchId: number, options: any): Promise<any> {
    const results: any = {};
    const promise = Switch.findOne({
      where: { id: switchId },
      include: [
        {
          model: Control,
          as: "control",
          include: [{ model: Device, as: "device" }],
        },
      ],
    })
      .then((sw: any) => {
        if (!sw) throw new Error("No Switch found");
        results.sw = sw;

        let state = sw.state;
        const cmd = options.command;
        if (cmd === "on") state = true;
        else if (cmd === "off") state = false;
        else if (cmd === "toggle") state = !state;
        else throw new Error("Invalid command for switch");
        // Check if this is a toggle
        results.changed = false;
        if (sw.state !== state) results.changed = true;
        // Prepare object for DB update
        results.update = {
          state: state,
        };
        // Prepare data to send
        const data = {};
        data[sw.name] = state;
        // Emit
        return DeviceService.action(
          sw.control.device,
          "set",
          JSON.stringify(data),
        );
      })
      .then(() => {
        results.sw.state = results.update.state;
        return results.sw.save();
      })
      .then(result => {
        // Append switch name to results
        results.update.name = results.sw.name;
        // Emit control event
        this.emit("event", {
          id: results.sw.controlId,
          command: results.sw.state ? "on" : "off",
        });
        // Also emit toggle event if state changed TODO check change
        if (results.changed)
          this.emit("event", { id: results.sw.controlId, command: "toggle" });
        return result;
      })
      .catch(err => {
        throw err;
      });
    return Promise.resolve(promise);
  }
}

const switchService = new SwitchService();
export default switchService;
