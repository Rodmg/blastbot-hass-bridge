import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Resource } from '../resource/resource';

@Injectable()
export class Button extends Resource {
  constructor(
    http: Http,
  ) {
    super(http);

    // this.routeConfig = {
    //   get: item => `/irbutton/${item.id}?populate=control`,
    //   getAll: () => '/irbutton',
    //   save: item => '/irbutton' + (item.id ? `/${item.id}` : ''),
    //   query: item =>
    //     `/control/${item.id}?populate=buttons&populate_buttons_limit=999`, // item is control
    //   remove: item => `/irbutton/${item.id}`,
    // };
    this.routeConfig = {
      get: item => `/irbutton/${item.id}?include=["Control"]`,
      getAll: () => '/irbutton',
      save: item => '/irbutton' + (item.id ? `/${item.id}` : ''),
      query: item =>
        `/control/${item.id}?include=["IRButton"]&populate_buttons_limit=999`, // item is control
      remove: item => `/irbutton/${item.id}`,
    };
  }

  query(item) {
    // Return buttons of control
    return this.http
      .get(this.serverAddress + this.routeConfig.query(item))
      .map((res: Response) => res.json().buttons);
  }

  emit(item) {
    return this.http
      .get(this.serverAddress + `/irbutton/${item.id}/execute`)
      .map((res: Response) => res.json());
  }
}
