import { Component } from "@angular/core";
import {
  NavController,
  NavParams,
  LoadingController,
  AlertController,
  ViewController,
  Platform,
  ModalController,
} from "ionic-angular";
import { SetupBlastbotPage } from "../setup-blastbot/setup-blastbot";
import { SetupBlastbotPlugPage } from "../setup-blastbot-plug/setup-blastbot-plug";
import { SetupBlastbotSwitchPage } from "../setup-blastbot-switch/setup-blastbot-switch";
import { SetupRfSensorPage } from "../setup-rf-sensor/setup-rf-sensor";

@Component({
  templateUrl: "setup-device.html",
})
export class SetupDevicePage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  isModal: boolean = false;

  constructor(
    public navCtrl: NavController,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public platform: Platform,
    public modalController: ModalController
  ) {
    this.isModal = navParams.get("isModal");
    if (this.isModal == null) this.isModal = false;
  }

  ionViewDidEnter() {
    //super.ionViewDidEnter();
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    //super.ionViewWillLeave();
    this.deregisterBackButton();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  setup(type: string) {
    let modal = null;
    if (type === "blastbot-ir") {
      modal = this.modalController.create(SetupBlastbotPage, {
        deviceId: null,
        isModal: true,
      });
    } else if (type === "blastbot-plug") {
      modal = this.modalController.create(SetupBlastbotPlugPage, {
        deviceId: null,
        isModal: true,
      });
    } else if (type === "blastbot-switch") {
      modal = this.modalController.create(SetupBlastbotSwitchPage, {
        deviceId: null,
        isModal: true,
      });
    } else if (type === "rf-sensor") {
      modal = this.modalController.create(SetupRfSensorPage, {
        deviceId: null,
        isModal: true,
      });
    } else return console.log("Unknown device type");

    modal.onDidDismiss((data) => {
      // Dismiss this modal after modal dismiss
      this.dismiss(null);
    });
    modal.present();
  }
}
