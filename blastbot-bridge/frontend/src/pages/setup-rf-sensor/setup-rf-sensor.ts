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
import { Subscription } from "rxjs/Subscription";
import { Device } from "../../providers/device/device";
import { SettingsProvider } from "../../providers/settings/settings";
import { TranslateService } from "@ngx-translate/core";
import { ProtoPage } from "../proto-page/proto-page";
import { goBuyBlastbot } from "../../components/util/util";
import { Events } from "ionic-angular";

@Component({
  templateUrl: "setup-rf-sensor.html",
})
export class SetupRfSensorPage extends ProtoPage {
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

  rfSettings: any = {
    type: "pir",
    delay: 10,
    code: "",
    name: "",
  };

  signal: boolean = false;
  doPoll: boolean = false;
  poller: Subscription;

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
    this.stopPolling();
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
    if (show) this.showLoading();

    this.Device.getAllRF().subscribe(
      (res: any) => {
        this.devices = res;

        // Load current device
        if (this.deviceId != null) {
          this.Device.get({ id: this.deviceId }).subscribe(
            (res) => {
              this.device = res;
              // Init ui variables
              this.rfSettings.code = this.device.mac;
              this.rfSettings.name = this.device.name;
              switch (this.device.type) {
                case "virtual-pir":
                  this.rfSettings.type = "pir";
                  break;
                case "virtual-door":
                  this.rfSettings.type = "door";
                  break;
                case "virtual-button":
                  this.rfSettings.type = "button";
                  break;
              }
              try {
                let parsedConfig = JSON.parse(this.device.config);
                if (parsedConfig.noPresenceDelay != null)
                  this.rfSettings.delay = parsedConfig.noPresenceDelay / 60; // Convert to minutes
              } catch (err) {
                console.log(err);
              }
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
    // When reconfiguring device, start polling existing code after device select
    if (this.rfSettings.code.length) this.startPolling();
  }

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
      title: this.translate.instant("setup-rf-sensor.no-sensor-found"),
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
      this.showSaveDialog();
      return;
    }

    this.currentPage++;
  }

  showSaveDialog() {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-rf-sensor.save-sensor"),
      //message: 'Introduce el nuevo nombre',
      inputs: [
        {
          name: "name",
          placeholder: this.translate.instant("setup-rf-sensor.new-name"),
          value: this.rfSettings.name,
        },
      ],
      buttons: [
        {
          text: this.translate.instant("cancel"),
        },
        {
          text: this.translate.instant("apply"),
          handler: (data) => {
            // validate
            if (!(data.name.length && data.name.length < 30)) {
              this.alert(
                this.translate.instant("controls.invalid-name"),
                this.translate.instant("controls.invalid-name-msg")
              );
              return false;
            }
            this.rfSettings.name = data.name;
            this.presentLoader(this.translate.instant("loading"));
            this.getOrCreateDevice().subscribe(
              (res) => {
                this.dismissLoader();
                this.dismiss(null);
              },
              (err) => {
                console.log("Error:", err);
                this.dismissLoader();
                this.noInternetError(() => {});
              },
              () => {}
            );
          },
        },
      ],
    });

    prompt.present();
  }

  pair(type: string | null = null) {
    this.stopPolling();
    let msg = "setup-rf-sensor.pairing";
    switch (type) {
      case "pir":
        msg = "setup-rf-sensor.pairing-pir";
        break;
      case "door":
        msg = "setup-rf-sensor.pairing-door";
        break;
      case "button":
        msg = "setup-rf-sensor.pairing-button";
        break;
    }
    this.presentLoader(this.translate.instant(msg));
    this.Device.learnRf({ id: this.selectedDevice.id }).subscribe(
      (res) => {
        this.dismissLoader();
        this.rfSettings.code = res;
        this.startPolling();
      },
      (err) => {
        console.log("Error:", err);
        this.dismissLoader();
        this.noBlastbotError(() => {
          this.pair(type);
        });
      },
      () => {}
    );
  }

  startPolling() {
    this.doPoll = true;
    this.poll();
  }

  stopPolling() {
    this.doPoll = false;
    if (this.poller != null) this.poller.unsubscribe();
  }

  poll() {
    this.poller = this.Device.learnRf({ id: this.selectedDevice.id }).subscribe(
      (res) => {
        if (this.rfSettings.code === res) {
          this.signal = true;
          setTimeout(() => {
            this.signal = false;
          }, 500);
        }
        if (this.doPoll) this.poll();
      },
      (err) => {
        console.log("Error:", err);
        if (this.doPoll) this.poll();
      },
      () => {}
    );
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }

  getOrCreateDevice() {
    let type: string = "virtual-pir";
    let config: string | null = null;
    switch (this.rfSettings.type) {
      case "pir":
        type = "virtual-pir";
        config = JSON.stringify({
          presenceDelay: 0,
          noPresenceDelay: this.rfSettings.delay * 60, // convert minutes to seconds
          presence: false,
          lastPresence: null,
        });
        break;
      case "door":
        type = "virtual-door";
        break;
      case "button":
        type = "virtual-button";
        break;
    }

    if (this.deviceId == null) {
      // Create device
      return Observable.create((observer) => {
        this.Device.save({
          type: type,
          bridgeId: this.selectedDevice.id,
          name: this.rfSettings.name,
          mac: this.rfSettings.code,
          config: config,
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
      // Update device
      return Observable.create((observer) => {
        this.Device.save({
          id: this.deviceId,
          type: type,
          bridgeId: this.selectedDevice.id,
          name: this.rfSettings.name,
          mac: this.rfSettings.code,
          config: config,
        }).subscribe(
          (res) => {
            this.device = res;
            observer.next(res);
          },
          (err) => observer.error(err),
          () => observer.complete()
        );
      });
    }
  }
}
