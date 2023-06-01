import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Resource } from '../resource/resource';

@Injectable()
export class ACSettings extends Resource {
  constructor(
    http: Http,
  ) {
    super(http);

    this.routeConfig = {
      get: item => `/acsettings/${item.id}`,
      getAll: () => '/acsettings',
      save: item => '/acsettings' + (item.id ? `/${item.id}` : ''),
      query: item => '',
      remove: item => `/acsettings/${item.id}`,
    };
  }

  emit(id, options) {
    return this.http
      .post(
        this.serverAddress + `/acsettings/${id}/execute`,
        options
      )
      .map((res: Response) => res.json());
  }

  emitTest(device, dbcontrol, command: string = 'on') {
    let data: Object = {
      dbcontrol: dbcontrol,
      device: device,
      command: command,
    };
    return this.http
      .post(
        this.serverAddress + '/acsettings/executetest',
        data
      )
      .map((res: Response) => res.json());
  }
}
