import { Component, NgZone } from '@angular/core';
import {
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  ViewController,
  Platform,
} from 'ionic-angular';
import { Device } from '../../providers/device/device';
import { ProtoPage } from '../proto-page/proto-page';
import { DBTypes } from '../../providers/db-types/db-types';
import { DBBrands } from '../../providers/db-brands/db-brands';
import { DBControls } from '../../providers/db-controls/db-controls';
import { ACSettings } from '../../providers/acsettings/acsettings';
import { Control } from '../../providers/control/control';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-scan-controls',
  templateUrl: 'scan-controls.html',
})
export class ScanControlsPage extends ProtoPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  index: number;
  controls: Array<any>;
  device: any;

  emittingSmart: boolean;
  stop: boolean;

  loading: boolean;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public Device: Device,
    public DBTypes: DBTypes,
    public DBBrands: DBBrands,
    public DBControls: DBControls,
    public ACSettings: ACSettings,
    public Control: Control,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public platform: Platform,
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

    this.controls = [];

    this.loading = true;
    this.stop = true;
    this.emittingSmart = false;
    this.index = 0;
    this.device = this.navParams.get('device');
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      this.dismiss(null);
    });

    let navControls = this.navParams.get('controls');
    if (!navControls) this.loadControls(true);
    else this.controls = navControls;
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.deregisterBackButton();
  }

  presentLoader() {
    this.loading = true;
    this.loader = this.loadingController.create({
      content: this.translate.instant('loading'),
    });
    this.loader.present();
  }

  dismissLoader() {
    this.loading = false;
    if (this.loader) this.loader.dismiss();
  }

  loadControls(show: boolean) {
    if (show) this.presentLoader();
    this.DBControls.query({ type: 'ac' }).subscribe(
      (res: any) => {
        this.controls = res;
      },
      err => {
        console.log(err);
        if (show) this.dismissLoader();
        this.presentErrorPage(() => {
          this.loadControls(true);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
      }
    );
  }

  dismiss(data) {
    this.stop = true;
    if (!data) data = null;
    this.viewCtrl.dismiss(data);
  }

  emitSmart(callback) {
    this.emittingSmart = true;
    this.ACSettings.emitTest(
      this.device.id,
      this.controls[this.index].id
    ).subscribe(
      (res: any) => {
        this.emittingSmart = false;
        callback();
      },
      err => {
        callback(err);
        console.log(err);
      },
      () => {
        this.emittingSmart = false;
      }
    );
  }

  scan() {
    if (this.stop) return console.log('stopped');
    this.emitSmart(err => {
      if (err) return console.log(err);
      if (this.index + 1 >= this.controls.length) return console.log('end');

      setTimeout(() => {
        this.index++;
        this.scan();
      }, 1000);
    });
  }

  startScanning() {
    this.stop = false;
    this.index = 0;
    this.scan();
  }

  stopScanning() {
    this.stop = true;
    let data = {
      index: this.index,
      controls: this.controls,
    };
    this.dismiss(data);
  }
}
