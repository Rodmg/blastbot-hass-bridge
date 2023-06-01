import { Component } from "@angular/core";
import {
  NavController,
  NavParams,
  LoadingController,
  AlertController,
  ViewController,
  Platform,
  ToastController,
} from "ionic-angular";
import { Http } from "@angular/http";
import { Device } from "../../providers/device/device";
import { TranslateService } from "@ngx-translate/core";
import { ProtoSetupWifiPage } from "../../components/proto-setup-wifi/proto-setup-wifi";

@Component({
  templateUrl: "../../components/proto-setup-wifi/proto-setup-wifi.html",
})
export class SetupBlastbotPage extends ProtoSetupWifiPage {
  baseTranslateClass: string = "setup-blastbot";
  images: any = {
    page1: "assets/img/setup-blastbot/blastbotBlink.gif",
    page2: "assets/img/setup-blastbot/blastbotPush.png",
    page3: "assets/img/setup-blastbot/blastbotLedOnAlone.png",
  };

  constructor(
    public navCtrl: NavController,
    public http: Http,
    public Device: Device,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public platform: Platform,
    public translate: TranslateService,
    public toastController: ToastController
  ) {
    super(
      navCtrl,
      http,
      Device,
      loadingController,
      alertController,
      navParams,
      viewCtrl,
      platform,
      translate,
      toastController
    );
  }

  goToHttpConfigPage() {
    return this.goToHttpConfigPageType(this.config.type);
  }

  isCorrectDeviceType(type: string): boolean {
    // Make sure this is a blastbot-ir or blastbot-hub
    // Allow when there is no config type because old firmwares didn't have that
    // If reconfiguring only allow same or null
    if (this.isReconfiguring) {
      if (type != null && type !== this.config.type) return false;
    }
    if (type != null && type !== "blastbot-ir" && type !== "blastbot-hub")
      return false;
    return true;
  }

  getOrCreateDevice() {
    return this.getOrCreateDeviceType("blastbot-ir");
  }
}
