import { Component, NgZone } from "@angular/core";
import {
  NavController,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from "ionic-angular";
import { ProtoPage } from "../proto-page/proto-page";
import { SettingsProvider } from "../../providers/settings/settings";
import { validateEmailString } from "../../components/email-validator/email-validator";
import { getTimezones } from "../../components/util/util";
import { TranslateService } from "@ngx-translate/core";

/*
  Generated class for the SettingsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: "settings.html",
})
export class SettingsPage extends ProtoPage {
  // Default profile, should load on startup
  profile: any = {
    advanced_user: false,
    time_zone: "America/Mexico_City",
    sound: true,
    locale: "es",
    notification_email: "",
    notify_via_push: false,
    notify_via_email: false,
    notify_errors: false,
    notify_task: false,
    notify_disconnect: false,
    notify_connect: false,
  };

  ready: boolean = false;
  timezones: Array<any> = getTimezones();
  languages: Array<string> = ["es", "en", "de", "pt"];

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public SettingsProvider: SettingsProvider,
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
  }

  ionViewWillEnter() {
    this.load();
  }

  load() {
    this.presentLoader();
    // this.SettingsProvider.loadProfile().subscribe(
    //   (res: any) => {
    //     this.profile = this.SettingsProvider.getProfile();
    //     this.ready = true;
    //   },
    //   (err: any) => {
    //     console.log(err);
    //     this.dismissLoader();
    //     this.presentErrorPage(() => {
    //       this.load();
    //     }); // Retry after presenting error
    //   },
    //   () => {
    //     this.dismissLoader();
    //   }
    // );
  }

  presentLoader() {
    this.loader = this.loadingController.create({
      content: this.translate.instant("loading"),
    });
    this.loader.present();
  }

  dismissLoader() {
    if (this.loader) this.loader.dismiss();
  }

  onToggleChanged() {
    // if (this.ready) this.SettingsProvider.setProfile(this.profile).subscribe();
  }

  editEmail() {
    let prompt = this.alertController.create({
      title: this.translate.instant("settings.notification-email"),
      //message: 'Introduce el nuevo nombre',
      inputs: [
        {
          name: "email",
          placeholder: this.translate.instant("settings.address"),
          type: "email",
          value: this.profile.notification_email,
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
            if (!validateEmailString(data.email)) return false;
            this.profile.notification_email = data.email;
            this.showLoading();
            // this.SettingsProvider.setProfile(this.profile).subscribe(
            //   res => {},
            //   err => {
            //     this.dismissLoader();
            //     this.presentErrorPage(() => {
            //       this.load();
            //     }); // Retry after presenting error
            //   },
            //   () => this.dismissLoader()
            // );
          },
        },
      ],
    });

    prompt.present();
  }
}
