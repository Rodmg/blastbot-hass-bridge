import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';

@Injectable()
export class DBBrands extends Resource {
  constructor(http: Http) {
    super(http);

    this.routeConfig = {
      get: item => `/dbbrand/${item.id}`,
      getAll: () => `/dbbrand`,
      save: item => `/dbbrand` + (item.id ? `/${item.id}` : ''),
      query: item =>
        `/dbbrand/filter?dbtypeId=${item.type}` +
        (item.filter ? `&search=${item.filter}` : '') +
        (item.skip ? `&skip=${item.skip}` : ''),
      remove: item => `/dbbrand/${item.id}`,
    };
  }
}
