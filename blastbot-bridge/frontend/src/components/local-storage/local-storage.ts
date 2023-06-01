import { Injectable } from "@angular/core";

@Injectable()
export class LocalStorage {
  isNative: boolean = false;

  constructor() {}

  public native(isNative: boolean) {
    this.isNative = isNative;
  }

  public getSync(key) {
    throw new Error(
      "LocalStorage:getSync method deprecated, use LocalStorage:get with Promises"
    );
    //return localStorage.getItem(key);
  }

  public get(key): Promise<any> {
    return new Promise((resolve, reject) => {
      let val: string = localStorage.getItem(key);
      resolve(val);
    });
  }

  public set(key, val): Promise<any> {
    return new Promise((resolve, reject) => {
      localStorage.setItem(key, val);
      resolve(true);
    });
  }

  public remove(key): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(key);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  public changeStorage(): Promise<any> {
    return Promise.resolve(true);
  }
}
