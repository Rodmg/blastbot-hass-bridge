/*
  JanitorService
    Manages periodical cleanup of DB according to business rules

  Business logic:
    Cleanup never connected devices after 24h
*/

import cron from "node-cron";
import { log } from "@/libraries/Log";
import { Device } from "@/models/Device";
import { Op } from "sequelize";

class JanitorService {
  init() {
    // Every day at 0:00
    cron.schedule("0 0 * * *", () => {
      const today = new Date();
      const hour = 60 * 60 * 1000;
      // const day = 24 * hour;
      // const days30ago = new Date(today.getTime() - 30 * day);
      const hours1ago = new Date(today.getTime() - 1 * hour);

      // Cleanup never connected devices after 24h
      Device.destroy({
        where: { loggedAt: null, createdAt: { [Op.lt]: hours1ago } },
      }).catch((err) => {
        if (err) return log.error("Jaintor error:", err);
      });
    });
  }
}

const janitorService = new JanitorService();
export default janitorService;
