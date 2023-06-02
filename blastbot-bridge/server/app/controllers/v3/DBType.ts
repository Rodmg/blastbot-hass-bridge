import { config } from "@/config";
import { Controller } from "@/libraries/Controller";
import { log } from "@/libraries/Log";
import blastbotCloudApiService from "@/services/BlastbotCloudApiService";
import axios from "axios";
import { Router } from "express";

class DBTypeController extends Controller {
  constructor() {
    super();
    this.name = "dbtype";
  }

  routes(): Router {
    this.router.get("/", async (req, res) => {
      let types = [];
      try {
        const token = await blastbotCloudApiService.getToken();
        if (token != null) {
          const r = await axios.get(
            `${config.blastbotCloudApi.baseUrl}/api/v3/dbtype`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          types = r.data;
        }
      } catch (err) {
        log.error("Error getting dbtypes from cloud", err.message);
      }
      res.status(200).json(types);
    });

    return this.router;
  }
}

const controller = new DBTypeController();
export default controller;
