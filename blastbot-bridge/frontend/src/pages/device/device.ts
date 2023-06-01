import { Component, NgZone } from '@angular/core';
import {
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from 'ionic-angular';
import { ProtoPage } from '../proto-page/proto-page';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: 'device.html',
})
export class DevicePage extends ProtoPage {
  device: any;
  config: any;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public navParams: NavParams,
    public translate: TranslateService
  ) {
    super(
      navCtrl,
      alertController,
      loadingController,
      modalController,
      toastCtrl,
      zone,
      translate
    );
    this.device = navParams.get('device');

    this.config = null;

    if (this.device.config != null) {
      try {
        this.config = JSON.parse(this.device.config);
        //console.log(this.config);
      } catch (err) {
        console.log(err);
      }
    }
  }

  ionViewWillEnter() {}

  appResumed() {}

  checkDisconnected() {
    this.alert(
      this.translate.instant('device.device-disconnected'),
      this.translate.instant('device.device-disconnected-msg', {
        name: this.device.name,
      })
    );
  }

  parseMAC(mac) {
    let m = mac.match(/.{1,2}/g);
    m = m.join(':');
    return m;
  }

  getDeviceTypeName(device: any) {
    if (device.type === 'blastbot-ir') return 'Blastbot Smart Control';
    if (device.type === 'blastbot-hub') return 'Blastbot Hub';
    if (device.type === 'blastbot-plug') return 'Blastbot Smart Plug';
    if (
      device.type === 'blastbot-switch' ||
      device.type === 'blastbot-switch-1' ||
      device.type === 'blastbot-switch-3'
    )
      return 'Blastbot Smart Switch';
    if (device.type === 'virtual-pir')
      return this.translate.instant('device.virtual-pir');
    if (device.type === 'virtual-door')
      return this.translate.instant('device.virtual-door');
    if (device.type === 'virtual-button')
      return this.translate.instant('device.virtual-button');
    return 'Blastbot';
  }

}
