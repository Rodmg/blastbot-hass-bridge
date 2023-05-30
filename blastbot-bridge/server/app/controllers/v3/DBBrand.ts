import { config } from "@/config";
import { Controller } from "@/libraries/Controller";
import { log } from "@/libraries/Log";
import blastbotCloudApiService from "@/services/BlastbotCloudApiService";
import axios from "axios";
import { Request, Response, Router } from "express";

class DBBrandController extends Controller {
  constructor() {
    super();
    this.name = "dbbrand";
  }

  routes(): Router {
    this.router.get("/filter", (req, res) => this.filter(req, res));

    return this.router;
  }

  // Get brands from one specific type
  async filter(req: Request, res: Response) {
    const dbtypeId: number = parseInt(req.query.dbtypeId as string);
    let search: string = req.query.search as string;
    if (search == null) search = "";

    let brands = [];

    try {
      const token = await blastbotCloudApiService.getToken();
      const r = await axios.get(
        `${config.blastbotCloudApi.baseUrl}/api/v3/dbbrand/filter`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search,
            dbtypeId,
          },
        },
      );
      brands = r.data;
    } catch (err) {
      log.error("Error getting dbbrands from cloud", err.message);
    }

    res.status(200).json(brands);
  }
}

const controller = new DBBrandController();
export default controller;
