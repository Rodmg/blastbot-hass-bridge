import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';

@Injectable()
export class DBControls extends Resource {
  constructor(http: Http) {
    super(http);

    // this.routeConfig = {
    //   get: item =>
    //     `/dbcontrol/${
    //       item.id
    //     }?order=score%20DESC&populate=dbbuttons,dbbrand,dbtype&populate_buttons_limit=999`,
    //   getAll: () => `/dbcontrol`,
    //   save: item => `/dbcontrol` + (item.id ? `/${item.id}` : ''),
    //   query: item =>
    //     '/dbcontrol?order=score%20DESC&where=' +
    //     (item ? JSON.stringify(item) : '{}') +
    //     '&limit=999' +
    //     (item.skip ? `&skip=${item.skip}` : ''),
    //   remove: item => `/dbcontrol/${item.id}`,
    // };
    this.routeConfig = {
       get: item =>
         `/dbcontrol/${
           item.id
         }?order=score%20DESC&include=["DBButton","DBBrand","DBType"]&populate_buttons_limit=999`,
       getAll: () => `/dbcontrol`,
       save: item => `/dbcontrol` + (item.id ? `/${item.id}` : ''),
       query: item =>
         '/dbcontrol?order=score%20DESC&where=' +
         (item ? JSON.stringify(item) : '{}') +
         '&limit=999' +
         (item.skip ? `&skip=${item.skip}` : ''),
       remove: item => `/dbcontrol/${item.id}`,
     };
  }
}
