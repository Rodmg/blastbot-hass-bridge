import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Resource } from '../resource/resource';

@Injectable()
export class Control extends Resource {
  constructor(
    http: Http,
  ) {
    super(http);

    // this.routeConfig = {
    //   get: item =>
    //     `/control/${
    //       item.id
    //     }?populate=device,buttons,acSettings,origin,sharedControl,owner,switches&populate_buttons_limit=999`,
    //   getAll: () =>
    //     '/control?populate=device,sharedControl,owner,switches,acSettings,origin',
    //   save: item => '/control' + (item.id ? `/${item.id}` : ''),
    //   query: item => '',
    //   remove: item => `/control/${item.id}`,
    // };
    this.routeConfig = {
      get: item =>
        `/control/${
          item.id
        }?include=[{"Device":["Device.bridge"]},"IRButton","ACSettings","Switch"]
        &populate_buttons_limit=999`,
      getAll: () =>
        `/control?include=[{"Device":["Device.bridge"]},"IRButton","ACSettings","Switch"]`,
      save: item => '/control' + (item.id ? `/${item.id}` : ''),
      query: item => '',
      remove: item => `/control/${item.id}`,
    };
  }

  createFromDB(itemdb) {
    let data: Object = {
      dbcontrolId: itemdb.id,
      deviceId: itemdb.deviceId,
      name: itemdb.name,
    };
    return this.http
      .post(this.serverAddress + '/control/fromdb', data)
      .map((res: Response) => res.json());
  }

  updateMultiple(items) {
    return this.http
      .put(this.serverAddress + '/control/order', items)
      .map((res: Response) => res.json());
  }

  share(item) {
    let data: Object = {
      email: item.email,
    };
    return this.http
      .post(
        this.serverAddress + `/control/${item.id}/share`,
        data
      )
      .map((res: Response) => res.json());
  }

  removeShared(item) {
    return this.http
      .delete(this.serverAddress + `/control/shared/${item.id}`)
      .map((res: Response) => res.json());
  }

  getShared(item) {
    return this.http
      .get(this.serverAddress + `/control/shared/${item.id}?include=["User.user"]`)
      .map((res: Response) => res.json());
  }

  getAllShared(item) {
    return this.http
      .get(
        this.serverAddress +
          `/control/shared?where={"sharedControlId":${item.id}}&include=["User.user"]`
      )
      .map((res: Response) => res.json());
  }
}
