import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { Resource } from '../resource/resource';
import { Observable } from 'rxjs/Observable';
import { LocalStorage } from '../../components/local-storage/local-storage';
import { Events } from 'ionic-angular';

@Injectable()
export class SettingsProvider extends Resource {
  // Default profile, should load on startup
  profile: any = {
    advanced_user: false,
    time_zone: 'America/Mexico_City',
    sound: true,
    locale: 'es',
    notification_email: '',
    notify_errors: false,
    notify_task: false,
    notify_disconnect: false,
    notify_connect: false,
  };

  constructor(
    http: Http,
    public events: Events,
    public local: LocalStorage
  ) {
    super(http);

    this.routeConfig = {
      get: item => '',
      getAll: () => '',
      save: item => '',
      query: item => '',
      remove: item => '',
    };
  }

  loadProfile() {
   
  }

  saveProfile() {
   
  }

  changePassword(email, oldPass, newPass) {
    let data = {
      email: email,
      oldPass: oldPass,
      newPass: newPass,
    };
    return this.http
      .post(this.serverAddress + '/auth/change', data)
      .map((res: Response) => res.json());
  }

  getProfile() {
    return this.profile;
  }

  setProfile(profile: any) {
    this.profile = profile;
    return this.saveProfile();
  }

  getSound(): boolean {
    return this.profile.sound;
  }

  getAdvanced(): boolean {
    return this.profile.advanced_user;
  }

  getTimeZone(): string {
    return this.profile.time_zone;
  }

  getNotificationEmail(): string {
    return this.profile.notification_email;
  }

  getNotifyErrors(): boolean {
    return this.profile.notify_errors;
  }

  getNotifyTask(): boolean {
    return this.profile.notify_task;
  }

  getNotifyDisconnect(): boolean {
    return this.profile.notify_disconnect;
  }

  getNotifyConnect(): boolean {
    return this.profile.notify_connect;
  }

  setSound(value: boolean) {
    this.profile.sound = value;
    return this.saveProfile();
  }

  setAdvanced(value: boolean) {
    this.profile.advanced_user = value;
    return this.saveProfile();
  }

  setTimeZone(value: string) {
    this.profile.time_zone = value;
    return this.saveProfile();
  }

  setNotificationEmail(value: string) {
    this.profile.notification_email = value;
    return this.saveProfile();
  }

  setNotifyErrors(value: boolean) {
    this.profile.notify_errors = value;
    return this.saveProfile();
  }

  setNotifyTask(value: boolean) {
    this.profile.notify_task = value;
    return this.saveProfile();
  }

  setNotifyDisconnect(value: boolean) {
    this.profile.notify_disconnect = value;
    return this.saveProfile();
  }

  setNotifyConnect(value: boolean) {
    this.profile.notify_connect = value;
    return this.saveProfile();
  }

  getLocale(): string {
    return this.profile.locale;
  }

  setLocale(value: string) {
    this.profile.locale = value;
    return this.saveProfile();
  }
}
