require("dotenv").config();
import { log } from "@/libraries/Log";
import { setupDB } from "@/db";
import { setupServer } from "@/server";
import JanitorService from "@/services/JanitorService";
import MqttClient from "@/services/MqttClient";
import DeviceService from "@/services/DeviceService";
import SwitchService from "@/services/SwitchService";
import SensorService from "@/services/SensorService";
import HassWsApi from "./services/HassWsApi";

setupDB()
  .then(() => {
    MqttClient.init();
    DeviceService.init();
    SwitchService.init();
    JanitorService.init();
    SensorService.init();
    HassWsApi.init();
    setupServer();
  })
  .catch((err) => {
    log.error(err);
  });
