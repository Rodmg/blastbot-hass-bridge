import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Resource } from '../resource/resource';


@Injectable()
export class Switch extends Resource {
  constructor(
    http: Http,
  ) {
    super(http);

    this.routeConfig = {
      get: item => `/switch/${item.id}`,
      getAll: () => '/switch',
      save: item => '/switch' + (item.id ? `/${item.id}` : ''),
      query: item => '',
      remove: item => `/switch/${item.id}`,
    };
  }

  execute(item) {
    return this.http
      .post(this.serverAddress + `/switch/${item.id}/execute`, item.body)
      .map((res: Response) => res.json());
  }
}
