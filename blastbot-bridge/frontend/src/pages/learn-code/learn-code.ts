import { Component, NgZone } from "@angular/core";
import {
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  ViewController,
  Platform,
} from "ionic-angular";
import { Device } from "../../providers/device/device";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/forkJoin";
import { ProtoPage } from "../proto-page/proto-page";
import { Control } from "../../providers/control/control";
import { AudioComponent } from "../../components/audio/audio";
import { Button } from "../../providers/button/button";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "page-learn-code",
  templateUrl: "learn-code.html",
})
export class LearnCodePage extends ProtoPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  isLearning: boolean = false;
  code: string;
  control: any;
  type: string; // 'ir' or 'rf'

  showAlert: boolean = false;
  alertTitle: string;
  alertSubtitle: string;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public Device: Device,
    public Control: Control,
    public Button: Button,
    public viewCtrl: ViewController,
    public AudioComponent: AudioComponent,
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
    this.control = this.navParams.get("control");
    this.type = this.navParams.get("type");
    if (this.type == null) this.type = "ir";
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();

    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      if (this.isLearning) return; // Dont exit while learning
      this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.deregisterBackButton();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  alert(title, subtitle) {
    this.alertTitle = title;
    this.alertSubtitle = subtitle;
    this.showAlert = true;
  }

  dismissAlert() {
    this.showAlert = false;
  }

  learn() {
    this.isLearning = true;
    this.dismissAlert();
    let action: Observable<any>;
    if (this.type === "rf") action = this.Device.learnRf(this.control.device);
    else action = this.Device.learn(this.control.device);
    action.subscribe(
      (res) => {
        if (typeof res !== "string")
          return this.alert(
            this.translate.instant("learn-code.error-1"),
            this.translate.instant("learn-code.error-2")
          );
        this.code = res;
        if (this.code === "TIMEOUT") {
          return this.alert(
            this.translate.instant("learn-code.error-1"),
            this.translate.instant("learn-code.error-2")
          );
        } else if (this.type === "ir") {
          let parsedcode = this.code.split(",");
          if (parsedcode.length < 15)
            return this.alert(
              this.translate.instant("learn-code.error-1"),
              this.translate.instant("learn-code.error-2")
            );
        }
        this.dismiss({ code: this.code });
      },
      (err) => {
        console.log(err);
        this.alert(
          this.translate.instant("learn-code.error-1"),
          this.translate.instant("learn-code.error-3")
        );
        this.isLearning = false;
      },
      () => {
        this.isLearning = false;
      }
    );
  }
}
