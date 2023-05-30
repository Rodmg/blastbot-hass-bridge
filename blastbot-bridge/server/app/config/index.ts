import { Dialect } from "sequelize/types";
import ip from "ip";
import path from "path";

export const config = {
  root: path.normalize(`${__dirname}/..`),
  env: process.env.NODE_ENV || "development",
  server: { port: process.env.SERVER_PORT || 8888 },
  api: {
    // Default limit and offset levels for responses
    limit: 99,
    offset: 0,
    debug: true,
    useSocketRest: false,
  },
  log: {
    // Console Log levels: error, warn, info, verbose, debug, silly // Show detailed error responses or not
    level: process.env.LOG_LEVEL || "debug",
    logToFiles: process.env.LOG_TO_FILES
      ? process.env.LOG_TO_FILES === "true"
      : false,
  },
  urls: {
    // Url config as seen from the user NOT NECESSARILY THE SAME AS SERVER
    // http or https
    protocol: process.env.URLS_PROTOCOL || "",
    url: process.env.URLS_URL || "",
    port: process.env.URLS_PORT ? String(process.env.URLS_PORT) : "",
    apiRoot: process.env.URLS_API_ROOT || "/api/v3",
    base: "",
    baseApi: "",
  },
  db: {
    database: process.env.DB_NAME || "blastbotbridge",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "localhost",
    dialect: (process.env.DB_TYPE || "sqlite") as Dialect,
    logging: false,
    storage: process.env.DB_STORAGE || "db.sqlite",
  },
  mqtt: {
    user: process.env.MQTT_USER || "MQTT Username",
    password: process.env.MQTT_PASSWORD || "MQTT Password",
    keepalive: 10,
    connectTimeout: 10 * 1000,
    clientId: "BLASTBOT_BRIDGE",
    uri: process.env.MQTT_URI || "mqtt://localhost:1883",
    address: process.env.MQTT_ADDRESS || "localhost",
  },
  blastbotCloudApi: {
    baseUrl: process.env.BB_CLOUD_URL || "https://cloud.blastbot.io",
    user: process.env.BB_CLOUD_API_USER || "user@example.com",
    password: process.env.BB_CLOUD_API_PASSWORD || "password",
  },
  hassApi: {
    baseUrl: process.env.HASS_BASE_URL || "",
    token: process.env.HASS_API_TOKEN || "",
  },
};

let portString = "";
if (Number.isInteger(parseInt(config.urls.port)))
  portString = `:${config.urls.port}`;

config.urls.base = `${config.urls.protocol}://${config.urls.url}${portString}`;
config.urls.baseApi = `${config.urls.base}${config.urls.apiRoot}`;
