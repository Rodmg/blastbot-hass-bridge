import { Controller } from "@/libraries/Controller";
import { Device } from "@/models/Device";
import { Request, Response, Router } from "express";
import { stripNestedObjects } from "@/policies/General";
import DeviceService from "@/services/DeviceService";
import { log } from "@/libraries/Log";
import KissNetService from "@/services/KissNetService";

class DeviceController extends Controller {
  constructor() {
    super();
    this.name = "device";
    this.model = Device;
  }

  routes(): Router {
    this.router.get("/:id/action/:action", (req, res) => this.action(req, res));
    this.router.post("/:id/action/:action", (req, res) =>
      this.action(req, res),
    );

    this.router.get("/:id/info", (req, res) => this.info(req, res));

    // For KISSnet devices
    this.router.put("/:id/pair", (req, res) => this.pair(req, res));
    this.router.post("/:id/setbridge", (req, res) => this.setBridge(req, res));
    // For RF devices
    this.router.get("/:id/learnrf", (req, res) => this.learnRf(req, res));

    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.post("/", stripNestedObjects(), (req, res) =>
      this.create(req, res),
    );
    this.router.put("/:id", stripNestedObjects(), (req, res) =>
      this.update(req, res),
    );
    this.router.delete("/:id", (req, res) => this.destroy(req, res));

    return this.router;
  }

  async action(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    const action: string = req.params.action;
    let data = req.body.data;
    if (data == null) data = req.query.data;
    if (typeof data !== "string") data = null;

    if (id == null) return Controller.badRequest(res, "No id in request");

    let device: Device | null = null;
    try {
      device = await Device.findByPk(id);
    } catch (err) {
      log.debug(err);
      return Controller.notFound(res);
    }

    DeviceService.action(device, action, data)
      .then((result) => {
        Controller.ok(res, result);
      })
      .catch((err) => {
        log.debug(err);
        Controller.timeout(res, err);
      });
  }

  /** get device and update information device */
  async info(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    if (id == null) return Controller.badRequest(res, "No id in request");

    let device: Device | null = null;
    try {
      device = await Device.findByPk(id);
    } catch (err) {
      log.debug(err);
      return Controller.notFound(res);
    }
    if (device === null) {
      return Controller.badRequest(res, "No device instance");
    }

    DeviceService.getInformation(device)
      .then((result) => {
        Controller.ok(res, result);
      })
      .catch((err) => {
        log.debug(err);
        Controller.timeout(res, err);
      });
  }

  pair(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    if (id == null) return Controller.badRequest(res, "No id in request");
    KissNetService.sendPair(id)
      .then(() => {
        let tout = null;
        let interval = null;
        const interFunction = (id: number) => {
          Device.findOne({ where: { id: id } }).then((device) => {
            if (device == null) return;
            if (device.connected) {
              if (interval != null) clearInterval(interval);
              if (tout != null) clearTimeout(tout);
              return Controller.ok(res, "OK");
            }
          });
        };

        interval = setInterval(() => interFunction(id), 1000);
        tout = setTimeout(() => {
          if (interval) clearInterval(interval);
          return Controller.timeout(res, "TIMEOUT");
        }, 20000);
      })
      .catch((err) => {
        log.debug(err);
        Controller.timeout(res, err);
      });
  }

  // Expects { bridgeId: <number> } in body
  setBridge(req: Request, res: Response) {
    // Need to get and modify bridgeId for assignKNAddr to work as needed
    const id: number = parseInt(req.params.id);
    if (id == null) return Controller.badRequest(res, "No id in request");

    const bridgeId: number = req.body.bridgeId;
    if (bridgeId == null)
      return Controller.badRequest(res, "No bridgeId in body");

    let foundDevice = null;

    Device.findOne({
      where: { id: id },
      include: this.parseInclude(req),
    })
      .then((device: any) => {
        if (!device) {
          res.status(404).end();
          throw null;
        }
        foundDevice = device;
        if (!foundDevice.needsBridge()) {
          Controller.badRequest(res, "This device doesn't need a bridge");
          throw null;
        }
        // Update bridgeId if changed
        if (foundDevice.bridgeId !== bridgeId) {
          foundDevice.bridgeId = bridgeId;
          // Reassign kissnet address
          return foundDevice.assignKNAddr();
        }
        // Else continue without reassigning KNAddr
        return true;
      })
      .then(() => {
        return foundDevice.save();
      })
      .then(() => {
        res.status(200).json(foundDevice);
        return null;
      })
      .catch((err) => {
        if (err) Controller.serverError(res, err);
      });
  }

  learnRf(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);
    if (id == null) return Controller.badRequest(res, "No id in request");
    DeviceService.learnRf(id)
      .then((code: string) => {
        Controller.ok(res, code);
      })
      .catch((err) => {
        if (err) Controller.serverError(res, err);
      });
  }
}

const controller = new DeviceController();
export default controller;
