import { Component, NgZone } from '@angular/core';
import {
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  PopoverController,
  ViewController,
} from 'ionic-angular';
import { ProtoPage } from '../proto-page/proto-page';
import { Device } from '../../providers/device/device';
import { ACSettings } from '../../providers/acsettings/acsettings';
import { Control } from '../../providers/control/control';
import { AudioComponent } from '../../components/audio/audio';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';

import { ControlListPopover } from '../../components/control-list-popover/control-list-popover';

import { roundMinutes, mapSharedControl } from '../../components/util/util';

@Component({
  templateUrl: 'smart-control.html',
})
export class SmartControlPage extends ProtoPage {
  controls: Array<any>;
  control: any;
  settings: any = {};
  settingsShadow: any;
  tempLoading: boolean;
  dictionary: any;

  timeout: any;

  minutes: Array<number> = [0, 15, 30, 45];

  controlPopover: ControlListPopover;
  // For avoiding multiple loads on changeHandler
  alreadyLoading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public navParams: NavParams,
    public deviceProv: Device,
    public ACSettings: ACSettings,
    public Control: Control,
    public AudioComponent: AudioComponent,
    public popoverCtrl: PopoverController,
    public viewCtrl: ViewController,
    public translate: TranslateService,
    public events: Events
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
    this.controls = navParams.get('controls');
    this.control = navParams.get('control');
    this.tempLoading = false;

    this.controlPopover = new ControlListPopover(
      this.navCtrl,
      this.viewCtrl,
      this.popoverCtrl
    );
  }

  ionViewWillEnter() {
    this.load(true, null);
    this.events.subscribe('socket:change', this.changeHandler);
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.events.unsubscribe('socket:change', this.changeHandler);
  }

  appResumed() {
    this.load(true, null);
  }

  changeHandler = (data: any) => {
    if (
      data.model === 'control' ||
      data.model === 'acsetting' ||
      data.model === 'device'
    ) {
      if (!this.alreadyLoading) this.load(false, null, false);
    }
  };

  load(show: boolean, refresher: any, critical: boolean = true) {
    this.alreadyLoading = true;
    if (show) this.showLoading();
    this.Control.get(this.control).subscribe(
      res => {
        this.control = mapSharedControl(res);
        this.settings = this.control.acSettings;
        this.dictionary = this.control.acSettings.dictionary;
        if (this.settings.sleepTime != null)
          this.settings.sleepTime = new Date(this.settings.sleepTime);
        this.settingsShadow = JSON.parse(JSON.stringify(this.settings)); // copy
      },
      err => {
        this.alreadyLoading = false;
        this.hideLoading();
        if (refresher) refresher.complete();
        if (critical)
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
      },
      () => {
        this.alreadyLoading = false;
        this.hideLoading();
        if (refresher) refresher.complete();
      }
    );
  }

  getTemp() {
    this.tempLoading = true;
    this.deviceProv.getTemp(this.control.device).subscribe(
      res => {
        if (res == null)
          return this.notify(
            this.translate.instant('smart-control.no-communication')
          );
        this.alert(
          this.translate.instant('smart-control.temperature-in-room'),
          '',
          `${res}º C`
        );
      },
      err => {
        if (err.status === 504)
          this.notify(this.translate.instant('smart-control.no-communication'));
        else
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
        this.tempLoading = false;
      },
      () => {
        this.tempLoading = false;
      }
    );
  }

  checkDisconnected() {
    this.alert(
      this.translate.instant('smart-control.blastbot-disconnected'),
      this.translate.instant('smart-control.check-blastbot-connected', {
        name: this.control.device.name,
      })
    );
  }

  showAuto() {
    if (this.settings == null) return false;
    if (this.settings.state === 'off') return false;
    if (this.settings.fan === 'auto') return true;
  }

  showLow() {
    if (this.settings == null) return false;
    if (this.settings.state === 'off') return false;
    if (
      this.settings.fan === 'high' ||
      this.settings.fan === 'medium' ||
      this.settings.fan === 'low'
    )
      return true;
  }

  showMed() {
    if (this.settings == null) return false;
    if (this.settings.state === 'off') return false;
    if (this.settings.fan === 'high' || this.settings.fan === 'medium')
      return true;
  }

  showHigh() {
    if (this.settings == null) return false;
    if (this.settings.state === 'off') return false;
    if (this.settings.fan === 'high') return true;
  }

  toggle() {
    if (this.settings.state === 'on') this.settings.state = 'off';
    else if (this.settings.state === 'off') {
      this.settings.state = 'on';
      if (this.dictionary.defaults.hasOwnProperty('on')) {
        if (this.dictionary.defaults.on.hasOwnProperty('fan'))
          this.settings.fan = this.dictionary.defaults.on.fan;
        if (this.dictionary.defaults.on.hasOwnProperty('temperature'))
          this.settings.temperature = this.dictionary.defaults.on.temperature;
      }
    }
    this.emit(this.settings.state);
  }

  emit(command) {
    this.AudioComponent.playClick();
    this.showLoading();
    let options = {
      command: command,
      options: {
        temperature: this.settings.temperature,
        fan: this.settings.fan,
      },
    };
    this.ACSettings.emit(this.settings.id, options).subscribe(
      res => {
        // validate blastbot not responding
        if (res.status != null && res.status === false) {
          this.settings = JSON.parse(JSON.stringify(this.settingsShadow));
          return this.notify(
            this.translate.instant('smart-control.no-communication')
          );
        }

        this.settings = res;
        if (this.settings.sleepTime != null)
          this.settings.sleepTime = new Date(this.settings.sleepTime);
        this.settingsShadow = JSON.parse(JSON.stringify(this.settings));
      },
      err => {
        this.settings = JSON.parse(JSON.stringify(this.settingsShadow));
        if (err.status === 504)
          this.notify(this.translate.instant('smart-control.no-communication'));
        else
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
        this.hideLoading();
      },
      () => {
        this.hideLoading();
      }
    );
  }

  temperature(temp) {
    if (temp < 0) {
      temp = parseInt(this.settings.temperature) - 1;
    } else {
      temp = parseInt(this.settings.temperature) + 1;
    }

    if (this.dictionary.limits.set.temperature.indexOf(temp.toString()) < 0) {
      // Do nothing, emit same command
    } else {
      this.settings.temperature = temp.toString();
    }

    this.emitTimeout('set');
  }

  fan(fan_index) {
    var index =
      this.dictionary.limits.set.fan.indexOf(this.settings.fan) + fan_index;

    if (index > this.dictionary.limits.set.fan.length - 1) {
      index = 0;
    }

    if (index < 0) {
      index = this.dictionary.limits.set.fan.length - 1;
    }

    this.settings.fan = this.dictionary.limits.set.fan[index];

    this.emitTimeout('set');
  }

  emitTimeout(command) {
    if (this.timeout != null) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.emit(command);
      this.timeout = null;
    }, 500);
  }

  controlListPopover(event) {
    this.controlPopover.popover(event, this.controls);
  }

  presentLoader() {
    this.loader = this.loadingController.create({
      content: this.translate.instant('loading'),
    });
    this.loader.present();
  }

  dismissLoader() {
    if (this.loader) this.loader.dismiss();
  }

  getSleepTime(minutes: number): Date {
    let now: Date = new Date();
    let sleepTime: Date = new Date(now.getTime() + minutes * 60 * 1000);

    sleepTime = roundMinutes(sleepTime, this.minutes);

    return sleepTime;
  }

  getRemainingTime(sleepTime: Date) {
    if (!(sleepTime instanceof Date)) return 0;
    let now: Date = new Date();
    let diff = sleepTime.getTime() - now.getTime();
    diff = Math.round(diff / (60 * 60 * 1000));
    return diff;
  }

  selectTimer() {
    let inputs = [
      {
        type: 'radio',
        label: this.translate.instant('smart-control.disabled'),
        value: '0',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.1-hour'),
        value: '60',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '2' }),
        value: '120',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '3' }),
        value: '180',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '4' }),
        value: '240',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '5' }),
        value: '300',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '6' }),
        value: '360',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '7' }),
        value: '420',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '8' }),
        value: '480',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '9' }),
        value: '540',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '10' }),
        value: '600',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '11' }),
        value: '660',
        checked: false,
      },
      {
        type: 'radio',
        label: this.translate.instant('smart-control.n-hours', { n: '12' }),
        value: '720',
        checked: false,
      },
    ];

    if (this.settings == null) return;
    if (this.settings.sleepTime == null) inputs[0].checked = true;
    else {
      for (let input of inputs) {
        if (
          parseInt(input.value) / 60 ===
          this.getRemainingTime(this.settings.sleepTime)
        )
          input.checked = true;
      }
    }

    let alert = this.alertController.create({
      title: this.translate.instant('smart-control.sleep-timer'),
      inputs: inputs,
      buttons: [
        {
          text: this.translate.instant('cancel'),
          role: 'cancel',
          handler: data => {},
        },
        {
          text: this.translate.instant('ok'),
          handler: data => {
            let minutes = parseInt(data);
            if (minutes === 0) this.settings.sleepTime = null;
            else {
              let sleepTime = this.getSleepTime(minutes);
              let remainingTime = this.getRemainingTime(sleepTime);
              this.settings.sleepTime = sleepTime;
            }

            this.presentLoader();
            this.ACSettings.save(this.settings).subscribe(
              res => {
                //console.log(res);
              },
              err => {
                this.dismissLoader();
                this.presentErrorPage(() => {
                  this.load(true, null);
                }); // Retry after presenting error
              },
              () => {
                this.dismissLoader();
              }
            );
          },
        },
      ],
    });
    alert.present();
  }
}
