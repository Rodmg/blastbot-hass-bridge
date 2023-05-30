import { Controller } from "@/libraries/Controller";
import { Switch } from "@/models/Switch";
import { Request, Response, Router } from "express";
import { stripNestedObjects } from "@/policies/General";
import SwitchService from "@/services/SwitchService";

import { log } from "@/libraries/Log";

class SwitchController extends Controller {
  constructor() {
    super();
    this.name = "switch";
    this.model = Switch;
  }

  routes(): Router {
    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.put("/:id", stripNestedObjects(), (req, res) =>
      this.update(req, res),
    );
    this.router.post("/:id/execute", (req, res) => this.execute(req, res));
    this.router.post("/:id/update", (req, res) => this.updateOffline(req, res));

    return this.router;
  }

  // updateSwitch
  updateOffline(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    const options: any = req.body;
    if (id == null) return Controller.badRequest(res, "No id in request");
    SwitchService.updateSwitch(id, options)
      .then(result => {
        Controller.ok(res, result);
      })
      .catch(err => {
        log.debug(err);
        Controller.timeout(res, err);
      });
  }

  // Expects { command: 'on' | 'off' | 'toggle' } in body
  execute(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    const options: any = req.body;
    if (id == null) return Controller.badRequest(res, "No id in request");
    SwitchService.execute(id, options)
      .then(result => {
        Controller.ok(res, result);
      })
      .catch(err => {
        log.debug(err);
        Controller.timeout(res, err);
      });
  }
}

const controller = new SwitchController();
export default controller;
