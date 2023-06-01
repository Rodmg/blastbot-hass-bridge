import { Injectable } from "@angular/core";
import { Http, Response, Headers } from "@angular/http";
import "rxjs/add/operator/map";

// Global variable, should be available in scope
declare var blastbotCloudServer: any;

/*
  Base REST Resource class, you should extend this for your endpoints.
 */

// Provide functions for generating the url params for each case
export interface ResourceConfig {
  get: Function;
  getAll: Function;
  save: Function;
  query: Function;
  remove: Function;
}

@Injectable()
export class Resource {
  serverAddress: string;
  routeConfig: ResourceConfig;

  constructor(public http: Http) {
    if (!blastbotCloudServer.protocol || !blastbotCloudServer.url) {
      // Same as where frontend is hosted
      this.serverAddress = "api/v3";
    } else {
      this.serverAddress =
        blastbotCloudServer.protocol +
        "://" +
        blastbotCloudServer.url +
        blastbotCloudServer.port +
        "/api/v3"; //"https://cloud.blastbot.io/api/v3"
    }
  }

  get(item) {
    return this.http
      .get(this.serverAddress + this.routeConfig.get(item))
      .map((res: Response) => res.json());
  }

  getAll() {
    return this.http
      .get(this.serverAddress + this.routeConfig.getAll())
      .map((res: Response) => res.json());
  }

  save(item) {
    if (item.id) {
      return this.http
        .put(this.serverAddress + this.routeConfig.save(item), item)
        .map((res: Response) => res.json());
    } else {
      return this.http
        .post(this.serverAddress + this.routeConfig.save(item), item)
        .map((res: Response) => res.json());
    }
  }

  query(item) {
    return this.http
      .get(this.serverAddress + this.routeConfig.query(item))
      .map((res: Response) => res.json());
  }

  remove(item) {
    return this.http
      .delete(this.serverAddress + this.routeConfig.remove(item))
      .map((res: Response) => res.json());
  }
}
