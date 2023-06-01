import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';

@Injectable()
export class Device extends Resource {
  constructor(
    http: Http,
  ) {
    super(http);

    // this.routeConfig = {
    //   get: item => `/device/${item.id}`,
    //   getAll: () => '/device?where={"loggedAt":{"$not":null}}&populate=bridge',
    //   save: item => '/device' + (item.id ? `/${item.id}` : ''),
    //   query: item =>
    //     '/device?where={"loggedAt":{"$not":null}' +
    //     (item.type ? `,"type":"${item.type}"` : '') +
    //     '}',
    //   remove: item => `/device/${item.id}`,
    // };
    this.routeConfig = {
      get: item => `/device/${item.id}`,
      getAll: () => '/device?where={"loggedAt":{"$not":null}}&include=["Device"]',
      save: item => '/device' + (item.id ? `/${item.id}` : ''),
      query: item =>
        '/device?where={"loggedAt":{"$not":null}' +
        (item.type ? `,"type":"${item.type}"` : '') +
        '}',
      remove: item => `/device/${item.id}`,
    };
  }

  register() {
    return this.http
      .post(this.serverAddress + '/device', {})
      .map((res: Response) => res.json());
  }

  pair(item) {
    return this.http
      .put(this.serverAddress + `/device/${item.id}/pair`, {})
      .map((res: Response) => res.json());
  }

  setBridge(item) {
    return this.http
      .post(this.serverAddress + `/device/${item.id}/setbridge`, {
        bridgeId: item.bridgeId,
      })
      .map((res: Response) => res.json());
  }

  getAllRF() {
    return this.http
      .get(
        this.serverAddress +
          '/device?where={"loggedAt":{"$not":null},"type":"blastbot-hub"}'
      )
      .map((res: Response) => res.json());
  }

  getAllSensors() {
    return this.http
      .get(
        this.serverAddress +
          '/device?where={"loggedAt":{"$not":null},"type":{"$or":["virtual-door","virtual-pir","virtual-button"]}}'
      )
      .map((res: Response) => res.json());
  }

  getAllIrControl() {
    return this.http
      .get(
        this.serverAddress +
          '/device?where={"loggedAt":{"$not":null},"$or":[{"type":"blastbot-ir"},{"type":"blastbot-hub"}]}'
      )
      .map((res: Response) => res.json());
  }

  getTemp(item) {
    return this.http
      .get(this.serverAddress + `/device/${item.id}/action/temp`)
      .map((res: Response) => res.json());
  }

  emitCode(item, code) {
    return this.http
      .get(this.serverAddress + `/device/${item.id}/action/emit?data=${code}`)
      .map((res: Response) => res.json());
  }

  emitCodeRf(item, code) {
    return this.http
      .get(this.serverAddress + `/device/${item.id}/action/ook?data=${code}`)
      .map((res: Response) => res.json());
  }

  learn(item) {
    return this.http
      .get(this.serverAddress + `/device/${item.id}/action/learn`)
      .timeout(11000)
      .map((res: Response) => res.json());
  }

  learnRf(item) {
    return this.http
      .get(this.serverAddress + `/device/${item.id}/learnrf`)
      .timeout(11000)
      .map((res: Response) => res.json());
  }
}
