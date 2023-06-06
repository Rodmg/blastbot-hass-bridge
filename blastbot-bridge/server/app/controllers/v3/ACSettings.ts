import { Controller } from "@/libraries/Controller";
import { ACSettings } from "@/models/ACSettings";
import { Device } from "@/models/Device";
import { Request, Response, Router } from "express";
import { stripNestedObjects } from "@/policies/General";
import ACSettingsService from "@/services/ACSettingsService";
import { log } from "@/libraries/Log";

class ACSettingsController extends Controller {
  constructor() {
    super();
    this.name = "acsettings";
    this.model = ACSettings;
  }

  routes(): Router {
    this.router.post("/executetest", (req, res) => this.executeTest(req, res));

    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.put("/:id", stripNestedObjects(), (req, res) =>
      this.update(req, res),
    );
    this.router.post("/:id/execute", (req, res) => this.execute(req, res));
    this.router.post("/:id/update", (req, res) => this.updateOffline(req, res));

    return this.router;
  }

  async updateOffline(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    const options: any = req.body;
    if (id == null) return Controller.badRequest(res, "No id in request");

    let controlId: number | null = null;
    try {
      const instance = await ACSettings.findByPk(id);
      controlId = instance.controlId;
    } catch (err) {
      log.debug(err);
      return Controller.notFound(res);
    }

    try {
      const result = await ACSettingsService.updateControl(controlId, options);
      return Controller.ok(res, result);
    } catch (err) {
      log.debug(err);
      return Controller.timeout(res, err);
    }
  }

  async execute(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    const options: any = req.body;
    if (id == null) return Controller.badRequest(res, "No id in request");

    let controlId: number | null = null;
    try {
      const instance = await ACSettings.findByPk(id);
      controlId = instance.controlId;
    } catch (err) {
      log.debug(err);
      return Controller.notFound(res);
    }

    try {
      const result = await ACSettingsService.emitControl(controlId, options);
      return Controller.ok(res, result);
    } catch (err) {
      log.debug(err);
      return Controller.timeout(res, err);
    }
  }

  executeTest(req: Request, res: Response) {
    const where: any = req.session.where || {};
    where.id = req.body.device;
    const command = req.body.command;
    const dbControlId = req.body.dbcontrol;

    Device.findOne({ where: where })
      .then((device: any) => {
        if (!device) throw new Error(`No device with id ${where.id} found.`);

        ACSettingsService.emitTest(device.id, dbControlId, { command: command })
          .then((result) => {
            Controller.ok(res, result);
          })
          .catch((err) => {
            log.debug(err);
            Controller.timeout(res, err);
          });
      })
      .catch((err) => {
        log.debug(err);
        Controller.notFound(res, err);
      });
  }
}

const controller = new ACSettingsController();
export default controller;
