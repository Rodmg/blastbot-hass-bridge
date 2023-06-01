import { Component, NgZone } from "@angular/core";
import {
  NavController,
  NavParams,
  LoadingController,
  ModalController,
  ToastController,
  AlertController,
  ViewController,
  Platform,
} from "ionic-angular";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Device } from "../../providers/device/device";
import { SettingsProvider } from "../../providers/settings/settings";
import { TranslateService } from "@ngx-translate/core";
import { ProtoPage } from "../proto-page/proto-page";
import { goBuyBlastbot } from "../../components/util/util";
import { Events } from "ionic-angular";

@Component({
  templateUrl: "setup-blastbot-switch.html",
})
export class SetupBlastbotSwitchPage extends ProtoPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  loader: any;
  loading: boolean = false;
  isModal: boolean = false;

  currentPage: number = 1;
  deviceId: any = null; // Device id if reconfiguring

  selectedDevice: any;

  devices: Array<any>;
  device: any;
  mac: string;

  constructor(
    public navCtrl: NavController,
    public http: Http,
    public Device: Device,
    public Setting: SettingsProvider,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public alertController: AlertController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public platform: Platform,
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
    this.deviceId = navParams.get("deviceId");
    if (this.deviceId == null) this.deviceId = null;

    this.isModal = navParams.get("isModal");
    if (this.isModal == null) this.isModal = false;
  }

  ionViewDidEnter() {
    //super.ionViewDidEnter();
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      if (this.loading) return;
      if (this.currentPage > 1) this.back();
      else this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    //super.ionViewWillLeave();
    this.deregisterBackButton();
  }

  ionViewWillEnter() {
    this.load(true, null);
  }

  presentLoader(msg: string) {
    this.loading = true;
    this.loader = this.loadingController.create({
      content: msg,
    });
    this.loader.present();
  }

  dismissLoader() {
    this.loading = false;
    if (this.loader) this.loader.dismiss();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  back() {
    if (this.currentPage > 1) this.currentPage--;
  }

  load(show: boolean, refresher: any) {
    // if (this.configuring) return;
    if (show) this.showLoading();

    this.Device.getAllRF().subscribe(
      (res: any) => {
        console.log(res);
        this.devices = res;
      },
      (err) => {
        console.log(err);
        this.hideLoading();
        if (refresher) refresher.complete();
        this.presentErrorPage(() => {
          this.load(true, null);
        }); // Retry after presenting error
      },
      () => {
        this.hideLoading();
        if (refresher) refresher.complete();
      }
    );
  }

  selectDevice(device) {
    if (!device.connected) {
      this.alert(
        this.translate.instant("setup-blastbot-switch.blastbot-disconnected"),
        "",
        this.translate.instant(
          "setup-blastbot-switch.blastbot-disconnected-msg",
          { name: device.name }
        )
      );
      return;
    }
    this.selectedDevice = device;
    this.presentLoader(this.translate.instant("loading")); // Workaround for avoiding false click on searchbox on iOS (issue: #9)
    this.next();
    this.dismissLoader();
  }

  setConfigMode() {}

  configureBlastbot() {
    this.dismiss(null);
    this.events.publish("nav:configureBlastbot");
  }

  noInternetError(callback) {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-blastbot.no-internet"),
      message: this.translate.instant("setup-blastbot.no-internet-msg"),
      enableBackdropDismiss: false,
      buttons: [
        // {
        //   text: this.translate.instant('setup-blastbot.go-back'),
        //   role: 'cancel'
        // },
        {
          text: this.translate.instant("setup-blastbot.retry"),
          handler: () => {
            callback();
          },
        },
      ],
    });

    prompt.present();
  }

  noBlastbotError(callback) {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-blastbot-switch.no-blastbot-found"),
      message: this.translate.instant("setup-blastbot.no-blastbot-found-msg"),
      buttons: [
        {
          text: this.translate.instant("setup-blastbot.go-back"),
          role: "cancel",
        },
        {
          text: this.translate.instant("setup-blastbot.retry"),
          handler: () => {
            callback();
          },
        },
      ],
    });

    prompt.present();
  }

  next() {
    if (this.currentPage === 3) {
      this.presentLoader(this.translate.instant("loading"));
      this.getOrCreateDevice().subscribe(
        (res) => {
          this.dismissLoader();
          this.pair(this.device.id);
        },
        (err) => {
          console.log("Error:", err);
          this.dismissLoader();
          this.noInternetError(() => {
            this.next();
          });
        },
        () => {}
      );
      return;
    }

    this.currentPage++;
  }

  pair(id: number) {
    this.presentLoader(
      this.translate.instant("setup-blastbot-switch.searching-blastbot")
    );
    this.Device.pair({ id: id }).subscribe(
      (res) => {
        this.dismissLoader();
        this.dismiss(null);
      },
      (err) => {
        console.log("Error:", err);
        this.dismissLoader();
        this.noBlastbotError(() => {
          this.pair(id);
        });
      },
      () => {}
    );
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }

  getOrCreateDevice() {
    if (this.deviceId == null) {
      // Create device
      return Observable.create((observer) => {
        this.Device.save({
          type: "blastbot-switch",
          bridgeId: this.selectedDevice.id,
        }).subscribe(
          (res) => {
            this.device = res;
            observer.next(res);
          },
          (err) => observer.error(err),
          () => observer.complete()
        );
      });
    } else {
      // Get device and update bridge
      return Observable.create((observer) => {
        this.Device.setBridge({
          id: this.deviceId,
          bridgeId: this.selectedDevice.id,
        }).subscribe(
          (res) => {
            console.log(res);
            this.device = res;
            observer.next(res);
          },
          (err) => {
            observer.error(err);
          },
          () => observer.complete()
        );
      });
    }
  }
}
