/*
  BlastbotCloudApiService
    Manages authentication with Blastbot Cloud
 */

import { config } from "@/config";
import { log } from "@/libraries/Log";
import axios from "axios";

const MAX_TOKEN_LIFE = 60 * 60 * 1000; // 1 hour

class BlastbotCloudApiService {
  token: string | undefined;
  tokenUpdatedOn: Date | undefined;

  async getToken(): Promise<string | undefined> {
    const now = new Date().getTime();
    const isTokenExpired =
      this.tokenUpdatedOn != null
        ? now - this.tokenUpdatedOn.getTime() > MAX_TOKEN_LIFE
        : true;
    if (this.token != null && !isTokenExpired) {
      return this.token;
    }

    let token: string | undefined;
    try {
      const login = await axios.post(
        `${config.blastbotCloudApi.baseUrl}/api/v3/auth/login`,
        {
          email: config.blastbotCloudApi.user,
          password: config.blastbotCloudApi.password,
        },
      );
      token = login?.data?.token;
      this.token = token;
      this.tokenUpdatedOn = new Date();
    } catch (err) {
      log.error("Error logging into blastbot cloud", err.message);
    }

    return token;
  }
}

const blastbotCloudApiService = new BlastbotCloudApiService();
export default blastbotCloudApiService;
