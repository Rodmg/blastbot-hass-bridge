/*
  IRButtonService
  Button utilities (emit, learn)
*/

import { EventEmitter } from "events";
import { IRButton } from "@/models/IRButton";
import { Control } from "@/models/Control";
import DeviceService from "./DeviceService";
import { log } from "@/libraries/Log";

class IRButtonService extends EventEmitter {
  constructor() {
    super();
  }

  emitButton(id: number): Promise<string> {
    const promise = IRButton.findOne({
      where: { id: id },
      include: [{ model: Control, as: "control" }],
    }).then((button: any) => {
      if (!button) throw new Error("No device found");
      return DeviceService.emit(
        button.control.deviceId,
        button.code,
        button.type,
      )
        .then(result => {
          // Emit control event
          this.emit("event", { id: button.control.id, buttonId: button.id });
          return result;
        })
        .catch(err => {
          log.error("IRButtonService emitButton error:", err);
          throw err;
        });
    });

    return Promise.resolve(promise);
  }

  learn(id: number): Promise<string> {
    return DeviceService.learn(id);
  }
}

const irButtonService = new IRButtonService();
export default irButtonService;
