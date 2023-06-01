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
  PopoverController,
} from "ionic-angular";
import { ProtoPage } from "../proto-page/proto-page";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Control } from "../../providers/control/control";
import { SelectIconPage } from "../select-icon/select-icon";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "page-edit-control",
  templateUrl: "edit-control.html",
})
export class EditControlPage extends ProtoPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  public form = new FormGroup({
    name: new FormControl(
      "",
      Validators.compose([
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(30),
      ])
    ),
  });

  control: any;
  type: string;

  name: string;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public Control: Control,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public platform: Platform,
    public popoverCtrl: PopoverController,
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

    this.type = navParams.get("type");
    this.control = navParams.get("control");
    this.name = this.control.name;
    if (this.control.icon == null) this.control.icon = "";
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.deregisterBackButton();
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

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  submit() {
    let provider: any = this.Control;

    this.presentLoader();
    this.control.name = this.name;
    provider.save(this.control).subscribe(
      (res) => {
        this.dismiss(res);
      },
      (err) => {
        console.log(err);
        this.dismissLoader();
      },
      () => {
        this.dismissLoader();
      }
    );
  }

  selectIcon() {
    let modal = this.modalController.create(
      SelectIconPage,
      { icon: this.control.icon, allowNoIcon: false },
      { enableBackdropDismiss: true }
    );
    modal.onDidDismiss((data) => {
      if (data == null) return;
      if (data.icon != null) this.control.icon = data.icon;
    });
    modal.present();
  }
}
