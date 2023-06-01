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
import { Device } from "../../providers/device/device";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/forkJoin";
import { ProtoPage } from "../proto-page/proto-page";
import { Control } from "../../providers/control/control";
import { AudioComponent } from "../../components/audio/audio";
import { getRandomColor, colors } from "../../components/util/util";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Button } from "../../providers/button/button";
import { LearnCodePage } from "../learn-code/learn-code";
import { SelectIconPage } from "../select-icon/select-icon";
import { SelectColorPage } from "../select-color/select-color";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "page-add-button",
  templateUrl: "add-button.html",
})
export class AddButtonPage extends ProtoPage {
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
    code: new FormControl(
      "",
      Validators.compose([Validators.required, Validators.minLength(1)])
    ),
    // 'color': new FormControl('', Validators.compose([Validators.required])),
    // 'icon': new FormControl('', Validators.compose([]))
  });

  colors: Array<string> = colors;
  color: string;
  button: any;

  isNewButton: boolean = false;

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

    let ctrl = navParams.get("control");
    let btn = navParams.get("button");

    if (!btn) this.isNewButton = true;

    if (this.isNewButton) {
      this.button = {
        control: ctrl,
        name: this.translate.instant("add-button.new-button"),
        icon: "",
        color: getRandomColor(),
        code: "",
        type: "ir",
      };
    } else {
      this.button = btn;
      if (this.button.icon == null) this.button.icon = "";
      this.button.control = ctrl;
    }
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
      content: this.translate.instant("add-button.loading"),
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
    this.presentLoader();
    let buttonCpy = { ...this.button };
    delete buttonCpy.control.buttons; // Avoid circular JSON error
    this.Button.save(buttonCpy).subscribe(
      (res) => {
        this.dismiss(null);
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

  emit() {
    let action: Observable<any>;
    if (this.button.type === "rf")
      action = this.Device.emitCodeRf(
        this.button.control.device,
        this.button.code
      );
    else
      action = this.Device.emitCode(
        this.button.control.device,
        this.button.code
      );
    action.subscribe(
      (res) => {},
      (err) => {
        console.log(err);
      },
      () => {}
    );
  }

  learn() {
    let modal = this.modalController.create(
      LearnCodePage,
      { control: this.button.control, type: this.button.type },
      { enableBackdropDismiss: false }
    );
    modal.onDidDismiss((data) => {
      if (data == null) return;
      if (data.code) this.button.code = data.code;
    });
    modal.present();
  }

  selectIcon() {
    let modal = this.modalController.create(
      SelectIconPage,
      { icon: this.button.icon },
      { enableBackdropDismiss: true }
    );
    modal.onDidDismiss((data) => {
      if (data == null) return;
      if (data.icon != null) this.button.icon = data.icon;
    });
    modal.present();
  }

  selectColor() {
    let modal = this.modalController.create(
      SelectColorPage,
      { icon: this.button.color },
      { enableBackdropDismiss: true }
    );
    modal.onDidDismiss((data) => {
      if (data == null) return;
      if (data.color != null) this.button.color = data.color;
    });
    modal.present();
  }
}
