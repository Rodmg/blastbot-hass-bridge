import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';

@Injectable()
export class DBSmartControls extends Resource {
  constructor(http: Http) {
    super(http);

    // this.routeConfig = {
    //   get: item => `/dbcontrol/${item.id}?populate=brand`,
    //   getAll: () => `/dbcontrol`,
    //   save: item => `/dbcontrol` + (item.id ? `/${item.id}` : ''),
    //   query: item =>
    //     `/dbcontrol?limit=999&type=ac` +
    //     (item.brand ? `&brand=${item.brand}` : '') +
    //     (item.skip ? `&skip=${item.skip}` : ''),
    //   remove: item => `/dbcontrol/${item.id}`,
    // };
    this.routeConfig = {
       get: item => `/dbcontrol/${item.id}?include=["DBBrand"]`,
       getAll: () => `/dbcontrol`,
       save: item => `/dbcontrol` + (item.id ? `/${item.id}` : ''),
       query: item =>
         `/dbcontrol?limit=999&type=ac` +
         (item.brand ? `&brand=${item.brand}` : '') +
         (item.skip ? `&skip=${item.skip}` : ''),
       remove: item => `/dbcontrol/${item.id}`,
     };
  }
}
