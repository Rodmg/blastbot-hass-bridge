import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';

@Injectable()
export class DBTypes extends Resource {
  constructor(http: Http) {
    super(http);

    this.routeConfig = {
      get: item => `/dbtype/${item.id}`,
      getAll: () => `/dbtype`,
      save: item => `/dbtype` + (item.id ? `/${item.id}` : ''),
      query: item =>
        `/dbtype?where={"name":{"$like":"%25${item.filter}%25"}}` +
        (item.skip ? `&skip=${item.skip}` : ''),
      remove: item => `/dbtype/${item.id}`,
    };
  }
}
