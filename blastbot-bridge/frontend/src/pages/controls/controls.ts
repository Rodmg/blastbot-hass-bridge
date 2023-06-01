import { Component, NgZone } from "@angular/core";
import {
  Platform,
  NavController,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  ActionSheetController,
} from "ionic-angular";
import { Control } from "../../providers/control/control";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/forkJoin";
import { ProtoPage } from "../proto-page/proto-page";
import { ControlPage } from "../control/control";
import { SmartControlPage } from "../smart-control/smart-control";
import { SwitchPage } from "../switch/switch";
import { AddControlPage } from "../add-control/add-control";
import { reorderArray } from "ionic-angular";
import { style, animate, transition, trigger } from "@angular/core";
import { EditControlPage } from "../edit-control/edit-control";
import { TranslateService } from "@ngx-translate/core";

import { AudioComponent } from "../../components/audio/audio";
import { Events } from "ionic-angular";

import { mapSharedControl } from "../../components/util/util";
import * as _ from "lodash";

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
    trigger("fadeSlideInOut", [
      transition(":enter", [
        // :enter is alias to 'void => *'
        style({ opacity: 0, transform: "translateX(-100%)" }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(":leave", [
        // :leave is alias to '* => void'
        animate(500, style({ opacity: 0, transform: "translateX(-100%)" })),
      ]),
    ]),
  ],
  templateUrl: "controls.html",
})
export class ControlsPage extends ProtoPage {
  controls: Array<any>;
  scenes: Array<any>;

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
    public Control: Control,
    public actionSheetCtrl: ActionSheetController,
    public platform: Platform,
    public translate: TranslateService,
    public AudioComponent: AudioComponent,
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
    // Make sure changes are saved
    this.setSwipeEnabled(true);
    this.events.unsubscribe("socket:change", this.changeHandler);
  }

  appResumed() {
    this.load(true, null);
  }

  changeHandler = (data: any) => {
    if (
      data.model === "control" ||
      data.model === "acsetting" ||
      data.model === "scene" ||
      data.model === "device" ||
      data.model === "switch"
    ) {
      if (!this.alreadyLoading) this.load(false, null, false);
    }
  };

  checkScenesChanged(newData: Array<any>): boolean {
    if (this.scenes == null) return true;
    if (this.scenes.length !== newData.length) return true;
    for (let i in this.scenes) {
      if (this.scenes[i].name !== newData[i].name) return true;
      if (this.scenes[i].icon !== newData[i].icon) return true;
      if (this.scenes[i].order !== newData[i].order) return true;
    }
    return false;
  }

  patchControls(newControls: Array<any>) {
    // If controls length varies or is not existent, force substitution
    if (this.controls == null || this.controls.length !== newControls.length) {
      this.controls = newControls;
      return;
    }
    for (let i in newControls) {
      if (newControls[i].id !== this.controls[i].id) {
        // Control changed (changed order or something), change all
        this.controls[i] = newControls[i];
      } else if (this.controls[i].avoidUpdate) {
        // Avoid update while loading (like a switch)
        continue;
      } else {
        // Patch key by key
        for (let key in newControls[i]) {
          // Deep comparision
          if (!_.isEqual(newControls[i][key], this.controls[i][key])) {
            this.controls[i][key] = newControls[i][key];
          }
        }
      }
    }
  }

  load(show: boolean, refresher: any, critical: boolean = true) {
    this.alreadyLoading = true;
    if (show) this.showLoading();

    Observable.forkJoin(
      this.Control.getAll().map((res) => (res = { type: "control", data: res }))
    ).subscribe(
      (res: any) => {
        for (let item of res) {
          if (item.type === "control") {
            let newControls: Array<any> = item.data
              .sort((a, b) => a.order - b.order)
              .map(mapSharedControl);
            this.patchControls(newControls);
          } else if (item.type === "scene") {
            let scenes = item.data.sort((a, b) => a.order - b.order);
            // Avoid loading icon on scenes being cancelled when executing scene and getting changes
            if (this.checkScenesChanged(scenes)) this.scenes = scenes;
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

  initials(name) {
    return name
      .match(/\b(\w)/g)
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  open(control, type) {
    if (this.inEditMode) {
      this.showActionSheet(control, type);
    } else {
      if (type === "ir")
        this.navCtrl.push(ControlPage, {
          controls: this.controls,
          control: control,
        });
      else if (type === "ac")
        this.navCtrl.push(SmartControlPage, {
          controls: this.controls,
          control: control,
        });
      else if (type === "switch")
        this.navCtrl.push(SwitchPage, {
          controls: this.controls,
          control: control,
        });
    }
  }

  showActionSheet(control, type) {
    let actionSheet;
    let { name } = control;
    if (control.isShared) {
      actionSheet = this.actionSheetCtrl.create({
        title: this.translate.instant("controls.actionsheet.title", { name }),
        buttons: [
          {
            text: this.translate.instant("controls.unfollow"),
            role: "destructive",
            icon: !this.platform.is("ios") ? "trash" : null,
            handler: () => {
              this.unfollowControl(control, type);
            },
          },
          {
            text: this.translate.instant("controls.cancel"),
            role: "cancel",
            icon: !this.platform.is("ios") ? "close" : null,
            handler: () => {},
          },
        ],
      });
    } else {
      let buttons: Array<any> = [
        {
          text: this.translate.instant("controls.remove"),
          role: "destructive",
          icon: !this.platform.is("ios") ? "trash" : null,
          handler: () => {
            this.deleteControl(control, type);
          },
        },
        {
          text: this.translate.instant("controls.edit"),
          icon: !this.platform.is("ios") ? "create" : null,
          handler: () => {
            this.editControl(control, type);
          },
        },
        {
          text: this.translate.instant("controls.cancel"),
          role: "cancel",
          icon: !this.platform.is("ios") ? "close" : null,
          handler: () => {},
        },
      ];

      if (type === "switch") {
        // Forbid deletion of switch control
        buttons.shift(); // remove delete option
      }

      actionSheet = this.actionSheetCtrl.create({
        title: this.translate.instant("controls.actionsheet.title", { name }),
        buttons,
      });
    }

    actionSheet.present();
  }

  doRefresh(refresher) {
    this.load(false, refresher);
  }

  editControl(control, type) {
    let modal = this.modalController.create(EditControlPage, {
      control: control,
      type: type,
    });
    modal.onDidDismiss((data) => {
      // Reload activities after modal dismiss
      this.load(true, null);
    });
    modal.present();
  }

  deleteControl(control, type) {
    let prompt = this.alertController.create({
      title: this.translate.instant("controls.delete-prompt.title"),
      message: this.translate.instant("controls.delete-prompt.text", {
        name: control.name,
      }),
      buttons: [
        {
          text: this.translate.instant("controls.cancel"),
          role: "cancel",
        },
        {
          text: this.translate.instant("controls.yes"),
          handler: () => {
            this.showLoading();
            this.Control.remove(control).subscribe(
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

  unfollowControl(control, type) {
    let prompt = this.alertController.create({
      title: this.translate.instant("controls.unfollow-prompt.title"),
      message: this.translate.instant("controls.unfollow-prompt.text", {
        name: control.name,
      }),
      buttons: [
        {
          text: this.translate.instant("controls.cancel"),
          role: "cancel",
        },
        {
          text: this.translate.instant("controls.yes"),
          handler: () => {
            this.showLoading();
            this.Control.remove(control).subscribe(
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

  addControl() {
    let modal = this.modalController.create(AddControlPage);
    modal.onDidDismiss((data) => {
      // Reload controls after modal dismiss
      this.load(true, null);
    });
    modal.present();
    //this.navCtrl.push(AddControlPage);
  }

  editMode() {
    this.inEditMode = !this.inEditMode;
    // Save changes on edit mode exit
    this.setSwipeEnabled(!this.inEditMode);
  }

  reorderItems(indexes) {
    this.controls = reorderArray(this.controls, indexes);
    this.reassignOrder();
  }

  reassignOrder() {
    let idx: number = 1;
    for (let item of this.controls) {
      item.order = idx++;
    }
    this.saveNewOrder();
  }

  saveNewOrder() {
    let items: Array<any> = [];
    for (let item of this.controls) {
      items.push({
        id: item.id,
        userId: item.userId,
        type: item.type,
        order: item.order,
      });
    }

    this.showLoading();
    this.Control.updateMultiple(items).subscribe(
      (res: any) => {
        //console.log(res);
      },
      (err) => {
        console.log(err);
        this.hideLoading();
        this.presentErrorPage(() => {
          this.load(true, null);
        }); // Retry after presenting error
      },
      () => {
        this.hideLoading();
      }
    );
  }

  showAddSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      buttons: [
        {
          text: this.translate.instant("controls.add-new-control"),
          icon: !this.platform.is("ios") ? "game-controller-a" : null,
          handler: () => {
            this.addControl();
          },
        },
        {
          text: this.translate.instant("controls.add-new-device"),
          icon: !this.platform.is("ios") ? "blastbot" : null,
          handler: () => {
            this.events.publish("nav:configureBlastbot");
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

  setSwipeEnabled(enabled: boolean) {
    this.events.publish("nav:setSwipeEnabled", enabled);
  }
}
