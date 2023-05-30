import { Application, static as Static, Request, Response } from "express";
import path from "path";
import { log } from "@/libraries/Log";
import { config } from "@/config";

const importedCtrls3 = require("require-dir-all")("controllers/v3");
const controllers3 = Object.keys(importedCtrls3).map(
  k => importedCtrls3[k].default,
);

function sendServersJs(req: Request, res: Response) {
  let portString = "";
  if (Number.isInteger(parseInt(config.urls.port)))
    portString = `:${config.urls.port}`;
  const template = `blastbotCloudServer = {
    protocol: "${config.urls.protocol}",
    url: "${config.urls.url}",
    port: "${portString}",
    brokerUrl: "${config.mqtt.address}"
  };`;
  res.set("Content-Type", "application/javascript");
  res.send(template);
}

export function routes(app: Application) {
  for (const controller of controllers3) {
    if (controller.name == null || controller.name.length === 0) {
      log.error("Invalid controller name:", controller.name, controller);
      continue;
    }
    app.use(`/api/v3/${controller.name}`, controller.routes());
  }

  app.get("/assets/servers.js", (req: Request, res: Response) =>
    sendServersJs(req, res),
  );

  app.use(Static(path.join(__dirname, "../public")));
}
