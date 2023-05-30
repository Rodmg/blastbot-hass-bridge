import { Controller } from "@/libraries/Controller";
import { IRButton } from "@/models/IRButton";
import { Request, Response, Router } from "express";
import { stripNestedObjects } from "@/policies/General";
import IRButtonService from "@/services/IRButtonService";

class IRButtonController extends Controller {
  constructor() {
    super();
    this.name = "irbutton";
    this.model = IRButton;
  }

  routes(): Router {
    this.router.post("/:id/execute", (req, res) => this.execute(req, res));
    this.router.get("/:id/execute", (req, res) => this.execute(req, res));

    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.post(
      "/",
      stripNestedObjects(),

      (req, res) => this.create(req, res),
    );
    this.router.put("/:id", stripNestedObjects(), (req, res) =>
      this.update(req, res),
    );
    this.router.delete("/:id", (req, res) => this.destroy(req, res));

    return this.router;
  }

  execute(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    if (id == null) return Controller.badRequest(res, "No id in request");
    IRButtonService.emitButton(id)
      .then(result => {
        Controller.ok(res, result);
      })
      .catch(err => {
        Controller.timeout(res, err);
      });
  }
}

const controller = new IRButtonController();
export default controller;
