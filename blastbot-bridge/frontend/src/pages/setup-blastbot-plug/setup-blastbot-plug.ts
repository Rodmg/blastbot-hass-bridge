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
export class SetupBlastbotPlugPage extends ProtoSetupWifiPage {
  baseTranslateClass: string = "setup-blastbot-plug";
  images: any = {
    page1: "assets/img/setup-blastbot-plug/plug-blink.gif",
    page2: "assets/img/setup-blastbot-plug/plug-push.png",
    page3: "assets/img/setup-blastbot-plug/plug-led-on.png",
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
    return this.goToHttpConfigPageType("blastbot-plug");
  }

  isCorrectDeviceType(type: string): boolean {
    // Make sure this is a blastbot-plug
    if (type !== "blastbot-plug") return false;
    return true;
  }

  getOrCreateDevice() {
    return this.getOrCreateDeviceType("blastbot-plug");
  }
}
