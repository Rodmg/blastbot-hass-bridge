import blastbotCloudApiService from "@/services/BlastbotCloudApiService";
import { Controller } from "@/libraries/Controller";
import { Request, Response, Router } from "express";
import axios from "axios";
import { log } from "@/libraries/Log";
import { config } from "@/config";

class DBControlController extends Controller {
  constructor() {
    super();
    this.name = "dbcontrol";
  }

  routes(): Router {
    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));

    return this.router;
  }

  async find(req: Request, res: Response) {
    let controls = [];

    try {
      const token = await blastbotCloudApiService.getToken();
      const r = await axios.get(
        `${config.blastbotCloudApi.baseUrl}/api/v3/dbcontrol`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...req.query,
          },
        },
      );
      controls = r.data;
    } catch (err) {
      log.error("Error getting dbcontrols from cloud", err.message);
    }

    res.status(200).json(controls);
  }

  async findOne(req: Request, res: Response) {
    const id: number = parseInt(req.params.id);

    let control = {};

    try {
      const token = await blastbotCloudApiService.getToken();
      const r = await axios.get(
        `${config.blastbotCloudApi.baseUrl}/api/v3/dbcontrol/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...req.query,
          },
        },
      );
      control = r.data;
    } catch (err) {
      log.error("Error getting dbcontrol from cloud", err.message);
    }

    res.status(200).json(control);
  }
}

const controller = new DBControlController();
export default controller;
