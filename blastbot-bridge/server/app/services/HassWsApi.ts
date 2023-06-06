// Polyfill WebSocket for HassWsApi
const wnd = globalThis;
wnd.WebSocket = require("ws");

import { config } from "@/config";
import { log } from "@/libraries/Log";
import {
  createConnection,
  createLongLivedTokenAuth,
  Connection,
} from "home-assistant-js-websocket";

const HASS_BASE_URL = config.hassApi.baseUrl;
const HASS_API_TOKEN = config.hassApi.token;

interface HassUser {
  id: string;
  credentials: any[];
  group_ids: string[];
  is_active: boolean;
  is_owner: boolean;
  local_only: boolean;
  name: string;
  system_generated: boolean;
  username: string | null;
}

interface HassUserResult {
  user: HassUser;
}

class HassWsApi {
  connection: Connection;

  async init() {
    try {
      const auth = createLongLivedTokenAuth(HASS_BASE_URL, HASS_API_TOKEN);
      this.connection = await createConnection({ auth });
    } catch (err) {
      log.error("HassWsApi: Error initializing:", err);
    }
  }

  async listUsers(): Promise<HassUser[]> {
    const users = await this.connection.sendMessagePromise<HassUser[]>({
      type: "config/auth/list",
    });
    return users;
  }

  async createDeviceUser(
    name: string,
    username: string,
    password: string,
  ): Promise<void> {
    try {
      const createdUser =
        await this.connection.sendMessagePromise<HassUserResult>({
          type: "config/auth/create",
          local_only: false,
          name,
          group_ids: ["system-users"],
        });

      await this.connection.sendMessagePromise<null>({
        type: "config/auth_provider/homeassistant/create",
        password,
        user_id: createdUser.user.id,
        username,
      });
    } catch (err) {}
  }

  async deleteDeviceUser(username: string): Promise<void> {
    try {
      const users = await this.listUsers();
      const user = users.find(
        (u) => u.username?.toLowerCase() === username.toLowerCase(),
      );
      if (!user) {
        log.error(
          "HassWsApi: Error deleting a Device User: User not found with username",
          username,
        );
        return;
      }
      await this.connection.sendMessagePromise<null>({
        type: "config/auth/delete",
        user_id: user.id,
      });
    } catch (err) {
      log.error("HassWsApi: Error deleting a Device User:", err);
    }
  }

  async updateDeviceUserName(username: string, newName: string): Promise<void> {
    try {
      const users = await this.listUsers();
      const user = users.find(
        (u) => u.username?.toLowerCase() === username.toLowerCase(),
      );
      if (!user) {
        log.error(
          "HassWsApi: Error updating a Device User: User not found with username",
          username,
        );
        return;
      }
      await this.connection.sendMessagePromise<null>({
        type: "config/auth/update",
        user_id: user.id,
        name: newName,
      });
    } catch (err) {
      log.error("HassWsApi: Error updating a Device User:", err);
    }
  }
}

const hassWsApi = new HassWsApi();
export default hassWsApi;
