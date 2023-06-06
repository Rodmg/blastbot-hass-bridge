import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import methodOverride from "method-override";
import favicon from "serve-favicon";
import path from "path";
import compression from "compression";
import { __express as handleBars } from "hbs";
import { routes } from "./routes";
import { log, requestLogStream } from "./libraries/Log";
import { config } from "@/config";
import { createServer } from "http";

export const app = express();
export const server = createServer(app);

// Security middleware
app.use(helmet());
// Util middleware
app.use(methodOverride());
app.use(favicon(path.join(__dirname, "../public/favicon.ico")));
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Response compression
app.use(compression());
// use morgan to log requests to the console
app.use(morgan("short", { stream: requestLogStream }));

app.set("views", `${config.root}/views`);
app.set("view engine", "html");
app.engine("html", handleBars);

// Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-XSRF-TOKEN, Access-Control-Allow-Headers",
  );
  next();
});

routes(app);

export function setupServer(): Promise<void> {
  return new Promise((resolve, _reject) => {
    server.listen(config.server.port, () => {
      log.info(`Blastbot Bridge started at port ${config.server.port}`);
      resolve();
    });
  });
}
