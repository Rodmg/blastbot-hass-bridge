import { Controller } from "@/libraries/Controller";
import { Control } from "@/models/Control";
import { IRButton } from "@/models/IRButton";
import { ACSettings } from "@/models/ACSettings";
import { Request, Response, Router } from "express";
import { getRandomColor } from "@/libraries/util";
import blastbotCloudApiService from "@/services/BlastbotCloudApiService";
import axios from "axios";
import { log } from "@/libraries/Log";
import { config } from "@/config";

class ControlController extends Controller {
  constructor() {
    super();
    this.name = "control";
    this.model = Control;
  }

  routes(): Router {
    this.router.post("/fromdb", (req, res) => this.createFromDB(req, res));
    this.router.put("/order", (req, res) => this.order(req, res)); // Ownership handled in order function

    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.post("/", (req, res) => this.create(req, res));
    this.router.put("/:id", (req, res) => this.update(req, res));
    this.router.delete("/:id", (req, res) => this.destroy(req, res));

    return this.router;
  }

  order(req: Request, res: Response) {
    const controls = req.body;
    if (!Array.isArray(controls))
      return Controller.badRequest(res, "Expecting array of controls.");
    const promises: Array<Promise<any>> = controls.map(control => {
      const promise = Control.update(
        { order: control.order },
        { where: { id: control.id } },
      );
      return Promise.resolve(promise);
    });

    Promise.all(promises)
      .then(() => {
        Controller.ok(res);
      })
      .catch(err => {
        Controller.serverError(res, err);
      });
  }

  async createFromDB(req: Request, res: Response) {
    const dbcontrolId: number = req.body.dbcontrolId;
    const deviceId: number = req.body.deviceId;
    const name: string = req.body.name;

    try {
      const token = await blastbotCloudApiService.getToken();
      const r = await axios.get(
        `${config.blastbotCloudApi.baseUrl}/api/v3/dbcontrol/${dbcontrolId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            include: '["DBButton","DBBrand","DBType"]',
            populate_buttons_limit: 999,
          },
        },
      );
      const dbcontrol = r.data;
      if (!dbcontrol) {
        return Controller.notFound(res, "No DBControl found.");
      }
      let newControlName = dbcontrol.dbbrand.name + " " + dbcontrol.model;
      if (name && name !== "Nuevo control") newControlName = name;
      // Create control
      const created = await Control.create({
        type: dbcontrol.type,
        name: newControlName,
        icon: dbcontrol.dbtype.icon,
        deviceId: deviceId,
      });

      let createdChildren;
      // Created ir control
      if (created.type === "ir") {
        // Prepare IRButtons for control
        const dbButtons: Array<any> = dbcontrol.dbbuttons;
        const newButtons: Array<any> = [];
        for (const button of dbButtons) {
          const newButton: any = {
            name: button.name,
            code: button.code,
            icon: button.icon,
            color: button.color != null ? button.color : getRandomColor(),
            order: button.order,
            controlId: created.id,
          };
          newButtons.push(newButton);
        }

        createdChildren = await IRButton.bulkCreate(newButtons);
      }
      // Created ac control
      if (created.type === "ac") {
        // Prepare ACSettings for control
        createdChildren = await ACSettings.create({
          controlId: created.id,
          dictionary: dbcontrol.dictionary,
        });
      }

      if (created.type === "ir") created.buttons = createdChildren;
      if (created.type === "ac") created.acSettings = createdChildren;
      res.status(201).json(created);
    } catch (err) {
      log.error("Error getting dbbrands from cloud", err.message);
      Controller.serverError(res, { message: "Internal Server Error" });
    }
  }
}

const controller = new ControlController();
export default controller;
