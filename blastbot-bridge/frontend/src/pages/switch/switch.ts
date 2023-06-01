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
  PopoverController,
  ViewController,
} from "ionic-angular";
import { Control } from "../../providers/control/control";
import { Switch } from "../../providers/switch/switch";
import { Button } from "../../providers/button/button";
import { Device } from "../../providers/device/device";
import { ProtoPage } from "../proto-page/proto-page";
import { AudioComponent } from "../../components/audio/audio";
import { TranslateService } from "@ngx-translate/core";
import { Events } from "ionic-angular";

import { ControlListPopover } from "../../components/control-list-popover/control-list-popover";

import { mapSharedControl } from "../../components/util/util";

declare const Hammer: any;

@Component({
  templateUrl: "switch.html",
})
export class SwitchPage extends ProtoPage {
  controls: Array<any>;
  control: any;

  switches: Array<any>;

  controlPopover: ControlListPopover;
  // For avoiding multiple loads on changeHandler
  alreadyLoading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public navParams: NavParams,
    public buttonProv: Button,
    public Control: Control,
    public Switch: Switch,
    public deviceProv: Device,
    public AudioComponent: AudioComponent,
    public actionSheetCtrl: ActionSheetController,
    public platform: Platform,
    public popoverCtrl: PopoverController,
    public viewCtrl: ViewController,
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
    this.controls = navParams.get("controls");
    this.control = navParams.get("control");

    this.controlPopover = new ControlListPopover(
      this.navCtrl,
      this.viewCtrl,
      this.popoverCtrl
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

  appResumed() {
    this.load(true, null);
  }

  changeHandler = (data: any) => {
    if (
      data.model === "control" ||
      data.model === "switch" ||
      data.model === "device"
    ) {
      if (!this.alreadyLoading) this.load(false, null, false);
    }
  };

  load(show: boolean, refresher: any, critical: boolean = true) {
    this.alreadyLoading = true;
    if (show) this.showLoading();

    this.Control.get(this.control).subscribe(
      (res) => {
        this.control = mapSharedControl(res);
        if (
          this.switches == null ||
          this.switches.length != this.control.switches.length
        ) {
          this.switches = this.control.switches;
        } else {
          for (let i in this.switches) {
            this.switches[i].state = this.control.switches[i].state;
          }
        }
      },
      (err) => {
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

  checkDisconnected() {
    this.alert(
      this.translate.instant("switch.device-disconnected"),
      this.translate.instant("switch.check-device-connected", {
        name: this.control.device.name,
      })
    );
  }

  execute(n: number, past_state?: boolean) {
    let data = {
      command: "on",
    };

    if (this.switches[n].state === true) data.command = "on";
    else data.command = "off";

    this.showLoading();

    this.Switch.execute({ id: this.switches[n].id, body: data }).subscribe(
      (res) => {
        //console.log(res);
      },
      (err) => {
        this.hideLoading();
        if (err.status === 504)
          this.notify(this.translate.instant("switch.no-communication"));
        else
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
        if (past_state) this.switches[n].state = past_state;
      },
      () => {
        this.hideLoading();
      }
    );
  }

  toggle(n: number) {
    let past_state = this.switches[n].state;
    this.switches[n].state = !this.switches[n].state;
    this.execute(n, past_state);
  }

  set(state, n: number) {
    let past_state = this.switches[n].state;
    this.switches[n].state = state;
    this.execute(n, past_state);
  }

  controlListPopover(event) {
    this.controlPopover.popover(event, this.controls);
  }
}
