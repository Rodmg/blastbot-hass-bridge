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
import { Button } from "../../providers/button/button";
import { Device } from "../../providers/device/device";
import { ProtoPage } from "../proto-page/proto-page";
import { AudioComponent } from "../../components/audio/audio";
import { AddButtonPage } from "../add-button/add-button";
import { style, animate, transition, trigger } from "@angular/core";
import { Events } from "ionic-angular";

import { ActionPopoverPage } from "../action-popover/action-popover";
import { ControlListPopover } from "../../components/control-list-popover/control-list-popover";

import { prepareButtons } from "../../components/button-view/button-view";

import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/from";
import "rxjs/add/observable/concat";

import { TranslateService } from "@ngx-translate/core";

import { mapSharedControl } from "../../components/util/util";

@Component({
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [
        // :enter is alias to 'void => *'
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(":leave", [
        // :leave is alias to '* => void'
        animate(500, style({ opacity: 0 })),
      ]),
    ]),
    trigger("growInOut", [
      transition(":enter", [
        // :enter is alias to 'void => *'
        style({ height: "0px", opacity: 0, padding: "0px" }),
        animate(200, style({ height: "auto", opacity: 1, padding: "16px" })),
      ]),
      transition(":leave", [
        // :leave is alias to '* => void'
        animate(200, style({ height: "0px", opacity: 0, padding: "0px" })),
      ]),
    ]),
  ],
  templateUrl: "control.html",
})
export class ControlPage extends ProtoPage {
  controls: Array<any>;
  control: any;
  buttons: Array<any>;

  tempLoading: boolean;

  inEditMode: boolean = false;

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
    public controlProv: Control,
    public deviceProv: Device,
    public AudioComponent: AudioComponent,
    public actionSheetCtrl: ActionSheetController,
    public platform: Platform,
    public popoverCtrl: PopoverController,
    public viewCtrl: ViewController,
    public events: Events,
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
    this.controls = navParams.get("controls");
    this.control = navParams.get("control");

    this.tempLoading = false;

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
    // Make sure changes are saved
    if (this.inEditMode) this.applyChanges();
    this.setSwipeEnabled(true);
    this.events.unsubscribe("socket:change", this.changeHandler);
  }

  appResumed() {
    this.load(true, null);
  }

  changeHandler = (data: any) => {
    if (
      data.model === "irbutton" ||
      data.model === "control" ||
      data.model === "device"
    ) {
      if (!this.alreadyLoading) this.load(false, null, false);
    }
  };

  load(show: boolean, refresher: any, critical: boolean = true) {
    this.alreadyLoading = true;
    if (show) this.showLoading();

    this.controlProv.get(this.control).subscribe(
      (res) => {
        this.control = mapSharedControl(res);
        this.buttons = prepareButtons(this.control.buttons);
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

  emit(button) {
    button.busy = true;

    // Limit pending requests to 3
    const MAX_PENDING_REQS = 3;
    if (button.pendingReqs == null) button.pendingReqs = 0;
    if (button.pendingReqs >= MAX_PENDING_REQS) return;
    button.pendingReqs++;

    this.AudioComponent.playClick();
    this.buttonProv.emit(button).subscribe(
      (res) => {
        if (res !== "OK")
          this.notify(this.translate.instant("control.no-communication"));
        if (button.pendingReqs > 0) button.pendingReqs--;
        if (button.pendingReqs === 0) button.busy = false;
      },
      (err) => {
        if (button.pendingReqs > 0) button.pendingReqs--;
        if (button.pendingReqs === 0) button.busy = false;
        if (err.status === 504)
          this.notify(this.translate.instant("control.no-communication"));
        else
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
      },
      () => (button.busy = false)
    );
  }

  getTemp() {
    this.tempLoading = true;
    this.deviceProv.getTemp(this.control.device).subscribe(
      (res) => {
        if (res == null)
          return this.notify(
            this.translate.instant("control.no-communication")
          );
        this.alert(
          this.translate.instant("control.temperature-in-room"),
          "",
          `${res}º C`
        );
      },
      (err) => {
        if (err.status === 504)
          this.notify(this.translate.instant("control.no-communication"));
        else
          this.presentErrorPage(() => {
            this.load(true, null);
          }); // Retry after presenting error
        this.tempLoading = false;
      },
      () => {
        this.tempLoading = false;
      }
    );
  }

  checkDisconnected() {
    this.alert(
      this.translate.instant("control.blastbot-disconnected"),
      this.translate.instant("control.check-blastbot-connected", {
        name: this.control.device.name,
      })
    );
  }

  editButton(button) {
    let modal = this.modalController.create(AddButtonPage, {
      control: this.control,
      button: button,
    });

    modal.onDidDismiss((data) => {
      // Reload buttons after modal dismiss
      this.load(true, null);
    });

    // First save any changes on order
    this.showLoadingPop();
    this.applyChanges(true).subscribe(
      (res) => {},
      (err) => {
        this.hideLoadingPop();
        this.presentErrorPage(() => {
          this.load(true, null);
        }); // Retry after presenting error
      },
      () => {
        this.hideLoadingPop();
        modal.present();
      }
    );
  }

  setSwipeEnabled(enabled: boolean) {
    this.events.publish("nav:setSwipeEnabled", enabled);
  }

  editMode() {
    this.inEditMode = !this.inEditMode;
    // Save changes on edit mode exit
    if (!this.inEditMode) this.applyChanges();
    this.setSwipeEnabled(!this.inEditMode);
  }

  deleteButton(button) {
    let prompt = this.alertController.create({
      title: this.translate.instant("control.delete-prompt.title"),
      message: this.translate.instant("control.delete-prompt.text", {
        name: button.name,
      }),
      buttons: [
        {
          text: this.translate.instant("cancel"),
          role: "cancel",
        },
        {
          text: this.translate.instant("yes"),
          handler: () => {
            this.showLoadingPop();
            Observable.concat(
              this.applyChanges(true),
              this.buttonProv.remove(button)
            ).subscribe(
              (res) => {},
              (err) => {
                this.hideLoadingPop();
                this.presentErrorPage(() => {
                  this.load(true, null);
                }); // Retry after presenting error
              },
              () => {
                this.load(true, null);
                this.hideLoadingPop();
              }
            );
          },
        },
      ],
    });

    prompt.present();
  }

  execute(button) {
    if (button.blank) return; // Ignore blank buttons
    if (this.inEditMode) {
      let actionSheet = this.actionSheetCtrl.create({
        title: this.translate.instant("control.edit-button"),
        buttons: [
          {
            text: this.translate.instant("remove"),
            role: "destructive",
            icon: !this.platform.is("ios") ? "trash" : null,
            handler: () => {
              this.deleteButton(button);
            },
          },
          {
            text: this.translate.instant("edit"),
            icon: !this.platform.is("ios") ? "create" : null,
            handler: () => {
              this.editButton(button);
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
    } else this.emit(button);
  }

  controlListPopover(event) {
    this.controlPopover.popover(event, this.controls);
  }

  actionMenu(event) {
    let popover = this.popoverCtrl.create(ActionPopoverPage, {
      items: [
        {
          type: "edit",
          name: this.translate.instant("edit"),
          icon: "create",
        },
        {
          type: "add",
          name: this.translate.instant("control.add-button"),
          icon: "add",
        },
      ],
    });

    popover.onDidDismiss((data) => {
      if (data == null) return;
      if (data.item.type === "edit") this.editMode();
      if (data.item.type === "add") this.editButton(null);
    });

    popover.present({
      ev: event,
      animate: true,
    });
  }

  applyChanges(observable: boolean = false) {
    let buttonsOb = Observable.from(this.buttons).map((button, index) => {
      if (button.blank || !button.changed) return Observable.of("no change");
      return this.buttonProv.save(button);
    });

    if (observable) return buttonsOb;

    this.showLoadingPop();
    buttonsOb.subscribe(
      (res) => {},
      (err) => {
        this.hideLoadingPop();
        this.presentErrorPage(() => {
          this.load(true, null);
        }); // Retry after presenting error
      },
      () => {
        this.hideLoadingPop();
      }
    );
    return null;
  }
}
