import { Component, NgZone } from "@angular/core";
import {
  Platform,
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  ActionSheetController,
} from "ionic-angular";
import { Device } from "../../providers/device/device";
import { SettingsProvider } from "../../providers/settings/settings";
import { Observable } from "rxjs/Observable";
import { ProtoPage } from "../proto-page/proto-page";
import { DevicePage } from "../device/device";
import { SetupBlastbotPage } from "../setup-blastbot/setup-blastbot";
import { SetupBlastbotPlugPage } from "../setup-blastbot-plug/setup-blastbot-plug";
import { SetupBlastbotSwitchPage } from "../setup-blastbot-switch/setup-blastbot-switch";
import { SetupDevicePage } from "../setup-device/setup-device";
import { SetupRfSensorPage } from "../setup-rf-sensor/setup-rf-sensor";
import { goBuyBlastbot } from "../../components/util/util";
import { TranslateService } from "@ngx-translate/core";
import { Events } from "ionic-angular";
import { isEqual } from "lodash";

/*
  Generated class for the DevicesPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: "devices.html",
})
export class DevicesPage extends ProtoPage {
  devices: Array<Object>;
  configuring: boolean = false;
  alreadyOpenedConfigure: boolean = false;

  inEditMode: boolean = false;
  // For avoiding multiple loads on changeHandler
  alreadyLoading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public Device: Device,
    public Setting: SettingsProvider,
    public navParams: NavParams,
    public actionSheetCtrl: ActionSheetController,
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
  }

  ionViewWillEnter() {
    this.load(true, null);
    this.events.subscribe("socket:change", this.changeHandler);
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.events.unsubscribe("socket:change", this.changeHandler);
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    if (this.alreadyOpenedConfigure) return; // Fixes reopening of configure when getting back to this view and after cancelling configure
    let newBlastbot = this.navParams.get("newBlastbot");
    this.alreadyOpenedConfigure = true;
    if (newBlastbot) this.configure(null);
  }

  appResumed() {
    this.load(true, null);
  }

  changeHandler = (data: any) => {
    if (data.model === "device") {
      if (!this.alreadyLoading) this.load(false, null, false);
    }
  };

  load(show: boolean, refresher: any, critical: boolean = true) {
    if (this.configuring) return;
    this.alreadyLoading = true;
    if (show) this.showLoading();

    this.Device.getAll().subscribe(
      (res: any) => {
        if (!isEqual(this.devices, res)) {
          this.devices = res;
        }
      },
      (err) => {
        console.log(err);
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

  initials(name) {
    return name
      .match(/\b(\w)/g)
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  doRefresh(refresher) {
    this.load(false, refresher);
  }

  open(device) {
    if (this.inEditMode) return this.showActionSheet(device);
    this.navCtrl.push(DevicePage, { device: device });
  }

  showActionSheet(device) {
    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant("devices.edit-device", {
        name: device.name,
      }),
      buttons: [
        {
          text: this.translate.instant("remove"),
          role: "destructive",
          icon: !this.platform.is("ios") ? "trash" : null,
          handler: () => {
            this.delete(device);
          },
        },
        {
          text: this.translate.instant("devices.change-name"),
          icon: !this.platform.is("ios") ? "create" : null,
          handler: () => {
            this.edit(device);
          },
        },
        {
          text: this.translate.instant("devices.reconfigure"),
          icon: !this.platform.is("ios") ? "build" : null,
          handler: () => {
            this.configure(device);
          },
        },
        {
          text: this.translate.instant("cancel"),
          role: "cancel",
          icon: !this.platform.is("ios") ? "close" : null,
          handler: () => {},
        },
      ],
    });

    actionSheet.present();
  }

  edit(device) {
    let prompt = this.alertController.create({
      title: this.translate.instant("devices.change-name"),
      //message: 'Introduce el nuevo nombre',
      inputs: [
        {
          name: "name",
          placeholder: this.translate.instant("devices.new-name"),
          value: device.name,
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
                this.translate.instant("devices.invalid-name"),
                this.translate.instant("devices.invalid-name-msg")
              );
              return false;
            }
            device.name = data.name;
            this.showLoading();
            this.Device.save(device).subscribe(
              (res) => {
                this.load(true, null);
              },
              (err) =>
                this.presentErrorPage(() => {
                  this.load(true, null);
                }) // Retry after presenting error
            );
          },
        },
      ],
    });

    prompt.present();
  }

  delete(device) {
    let prompt = this.alertController.create({
      title: this.translate.instant("devices.delete-prompt.title"),
      message: this.translate.instant("devices.delete-prompt.text", {
        name: device.name,
      }),
      buttons: [
        {
          text: this.translate.instant("cancel"),
          role: "cancel",
        },
        {
          text: this.translate.instant("yes"),
          handler: () => {
            this.showLoading();
            this.Device.remove(device).subscribe(
              (res) => {
                this.load(true, null);
              },
              (err) =>
                this.presentErrorPage(() => {
                  this.load(true, null);
                }) // Retry after presenting error
            );
          },
        },
      ],
    });

    prompt.present();
  }

  configure(device) {
    let id = null;
    let modal = null;
    if (device != null) id = device.id;

    if (id == null) {
      // new device, present device type selector
      modal = this.modalController.create(SetupDevicePage, { isModal: true });
    } else if (
      device.type === "blastbot-ir" ||
      device.type === "blastbot-hub"
    ) {
      modal = this.modalController.create(SetupBlastbotPage, {
        deviceId: id,
        isModal: true,
      });
    } else if (device.type === "blastbot-plug") {
      modal = this.modalController.create(SetupBlastbotPlugPage, {
        deviceId: id,
        isModal: true,
      });
    } else if (
      device.type === "blastbot-switch" ||
      device.type === "blastbot-switch-1" ||
      device.type === "blastbot-switch-3"
    ) {
      modal = this.modalController.create(SetupBlastbotSwitchPage, {
        deviceId: id,
        isModal: true,
      });
    } else if (
      device.type === "virtual-pir" ||
      device.type === "virtual-door" ||
      device.type === "virtual-button"
    ) {
      modal = this.modalController.create(SetupRfSensorPage, {
        deviceId: id,
        isModal: true,
      });
    } else {
      return console.log("unknown device type");
    }

    modal.onDidDismiss((data) => {
      // Reload devices after modal dismiss
      this.configuring = false;
      this.load(true, null);
    });
    this.configuring = true;
    modal.present();
  }

  editMode() {
    this.inEditMode = !this.inEditMode;
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }
}
