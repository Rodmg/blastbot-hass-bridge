import { Component, NgZone } from "@angular/core";
import {
  NavController,
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
import { DBTypes } from "../../providers/db-types/db-types";
import { DBBrands } from "../../providers/db-brands/db-brands";
import { DBControls } from "../../providers/db-controls/db-controls";
import { ACSettings } from "../../providers/acsettings/acsettings";
import { Control } from "../../providers/control/control";
import { SettingsProvider } from "../../providers/settings/settings";
import { ScanControlsPage } from "../scan-controls/scan-controls";
import { AudioComponent } from "../../components/audio/audio";
import { getRandomColor, goBuyBlastbot } from "../../components/util/util";
import { Events } from "ionic-angular";

import { prepareButtons } from "../../components/button-view/button-view";

import { TranslateService } from "@ngx-translate/core";
import { settings } from "cluster";

/*
  Generated class for the AddControl page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: "page-add-control",
  templateUrl: "add-control.html",
})
export class AddControlPage extends ProtoPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  devices: Array<any>;
  types: Array<any>;
  brands: Array<any>;
  controls: Array<any>;
  currentPage: number;

  selectedDevice: any;
  selectedType: any;
  selectedBrand: any;

  currentControl: any;
  controlSelect: any;

  typeFilter: string;
  brandFilter: string;

  emittingSmart: boolean;

  DEFAULT_TYPES: Array<any>;
  DEFAULT_BRANDS: Array<any>;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public Device: Device,
    public DBTypes: DBTypes,
    public DBBrands: DBBrands,
    public DBControls: DBControls,
    public ACSettings: ACSettings,
    public Control: Control,
    public Setting: SettingsProvider,
    public viewCtrl: ViewController,
    public AudioComponent: AudioComponent,
    public events: Events,
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
    this.typeFilter = "";
    this.brandFilter = "";
    this.currentPage = 1;

    this.emittingSmart = false;

    this.DEFAULT_TYPES = [
      {
        id: "blank",
        name: "blank-control",
      },
    ];

    this.DEFAULT_BRANDS = [
      {
        id: null,
        name: this.translate.instant("add-control.cant-find-brand"),
      },
    ];

    this.loadDevicesAndTypes(true, null);
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      if (this.currentPage > 1) this.back();
      else this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    super.ionViewWillLeave();
    this.deregisterBackButton();
  }

  loadDevicesAndTypes(show: boolean, refresher: any) {
    if (show) this.presentLoader();

    Observable.forkJoin(
      // Only get devices compatible with adding controls (blastbot-ir and blastbot-hub)
      this.Device.getAllIrControl().map(
        (res) => (res = { type: "devices", data: res })
      ),
      this.DBTypes.getAll().map(
        (res) =>
          (res = {
            type: "types",
            data: res.sort(function (a, b) {
              return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
            }),
          })
      ) // Sort by name, Fixes #7
    ).subscribe(
      (res: any) => {
        for (let item of res) {
          if (item.type === "devices") this.devices = item.data;
          else if (item.type === "types") {
            this.types = this.DEFAULT_TYPES;
            this.types = this.types.concat(item.data);
          }
        }
      },
      (err) => {
        console.log(err);
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
        this.presentErrorPage(() => {
          this.loadDevicesAndTypes(true, null);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
      }
    );
  }

  loadTypes(show: boolean, refresher: any) {
    if (show) this.presentLoader();

    this.DBTypes.query({ filter: this.typeFilter }).subscribe(
      (res: any) => {
        this.types = this.DEFAULT_TYPES;
        this.types = this.types.concat(
          res.sort(function (a, b) {
            return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
          })
        );
      },
      (err) => {
        console.log(err);
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
        this.presentErrorPage(() => {
          this.loadTypes(true, null);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
      }
    );
  }

  loadBrands(show: boolean, refresher: any) {
    if (show) this.presentLoader();

    this.DBBrands.query({
      filter: this.brandFilter,
      type: this.selectedType.id,
    }).subscribe(
      (res: any) => {
        this.brands = res;
        // Only append "All brands" to smartcontrol
        if (this.selectedType.name === "Aire Acondicionado") {
          this.brands = this.brands.concat(this.DEFAULT_BRANDS);
        }
      },
      (err) => {
        console.log(err);
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
        this.presentErrorPage(() => {
          this.loadBrands(true, null);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
      }
    );
  }

  loadControls(show: boolean, refresher: any) {
    if (show) this.presentLoader();

    let query: any = {};
    if (this.selectedType.id != null) query.dbtypeId = this.selectedType.id;
    if (this.selectedBrand.id != null) query.dbbrandId = this.selectedBrand.id;

    this.DBControls.query(query).subscribe(
      (res: any) => {
        this.controls = res;
        this.controlSelect = this.controls[0].id;
        this.loadControl(this.controls[0], false);
      },
      (err) => {
        console.log(err);
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
        this.presentErrorPage(() => {
          this.loadControls(true, null);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
        if (refresher) refresher.complete();
      }
    );
  }

  loadControl(control: any, show: boolean) {
    if (show) this.presentLoader();

    this.DBControls.get(control).subscribe(
      (res: any) => {
        this.currentControl = res;
        this.controlSelect = res.id;
        if (this.currentControl.type === "ir") {
          this.currentControl.buttons = res.dbbuttons.map((item) => {
            if (item.color == null) item.color = getRandomColor();
            return item;
          });
          this.currentControl.buttons = prepareButtons(
            this.currentControl.buttons
          );
        }
      },
      (err) => {
        console.log(err);
        if (show) this.dismissLoader();
        this.presentErrorPage(() => {
          this.loadControl(control, true);
        }); // Retry after presenting error
      },
      () => {
        if (show) this.dismissLoader();
      }
    );
  }

  presentLoader() {
    this.loader = this.loadingController.create({
      content: "Cargando...",
    });
    this.loader.present();
  }

  dismissLoader() {
    if (this.loader) this.loader.dismiss();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  selectDevice(device) {
    if (!device.connected) {
      this.alert(
        this.translate.instant("add-control.blastbot-disconnected"),
        "",
        this.translate.instant("add-control.blastbot-disconnected-msg", {
          name: device.name,
        })
      );
      return;
    }
    this.selectedDevice = device;
    this.presentLoader(); // Workaround for avoiding false click on searchbox on iOS (issue: #9)
    this.next();
    this.dismissLoader();
  }

  selectType(type) {
    if (type.id === "blank")
      return this.showSaveDialog({
        dbbrand: { name: "" },
        type: "ir",
        model: this.translate.instant("add-control.new-control"),
        id: "blank",
      });
    this.selectedType = type;
    this.loadBrands(true, null);
    this.next();
  }

  selectBrand(brand) {
    this.selectedBrand = brand;
    this.loadControls(true, null);
    this.next();
  }

  next() {
    this.currentPage++;
  }

  back() {
    if (this.currentPage > 1) this.currentPage--;
  }

  filterTypes(ev: any) {
    if (ev == null || ev.target == null || ev.target.value == null)
      this.typeFilter = "";
    else this.typeFilter = ev.target.value;
    this.loadTypes(false, null);
  }

  filterBrands(ev: any) {
    if (ev == null || ev.target == null || ev.target.value == null)
      this.brandFilter = "";
    else this.brandFilter = ev.target.value;
    this.loadBrands(false, null);
  }

  controlListChanged(event: any, selected: any) {
    this.loadControl({ id: this.controlSelect }, true);
  }

  prevControl() {
    let index = this.controls
      .map(function (e) {
        return e.id;
      })
      .indexOf(this.currentControl.id);
    if (index < 0) {
      console.log("bad index");
      return;
    }
    if (index <= 0) {
      this.alert(
        this.translate.instant("add-control.no-more-controls"),
        "",
        this.translate.instant("add-control.no-more-controls-msg")
      );
      return;
    }
    this.loadControl(this.controls[index - 1], true);
  }

  nextControl() {
    let index = this.controls
      .map(function (e) {
        return e.id;
      })
      .indexOf(this.currentControl.id);
    if (index < 0) {
      console.log("bad index");
      return;
    }
    if (index >= this.controls.length - 1) {
      this.alert(
        this.translate.instant("add-control.no-more-controls"),
        "",
        this.translate.instant("add-control.no-more-controls-msg")
      );
      return;
    }
    this.loadControl(this.controls[index + 1], true);
  }

  startScan() {
    let modal = this.modalController.create(ScanControlsPage, {
      /*controls: this.controls,*/ device: this.selectedDevice,
    });
    modal.onDidDismiss((data) => {
      if (data == null) return;
      if (data.controls != null) this.controls = data.controls;
      this.loadControl(this.controls[data.index], true);
    });
    modal.present();
  }

  emitSmart(command) {
    this.emittingSmart = true;
    this.AudioComponent.playClick();
    this.ACSettings.emitTest(
      this.selectedDevice.id,
      this.currentControl.id,
      command
    ).subscribe(
      (res: any) => {
        this.emittingSmart = false;
      },
      (err) => {
        console.log(err);
      },
      () => {
        this.emittingSmart = false;
      }
    );
  }

  emit(button) {
    button.busy = true;
    this.AudioComponent.playClick();
    this.Device.emitCode(this.selectedDevice, button.code).subscribe(
      (res: any) => {
        button.busy = false;
      },
      (err) => {
        console.log(err);
      },
      () => {
        button.busy = false;
      }
    );
  }

  showSaveDialog(controldef) {
    let name = this.translate.instant("add-control.new-control");
    let type = "ir";
    if (controldef != null) {
      type = controldef.type;
      name = `${controldef.dbbrand.name} ${controldef.model}`;
    }

    if (name.length > 30) name = name.substring(0, 29); // Trim names longer than 30. Fixes #6

    let prompt = this.alertController.create({
      title: this.translate.instant("add-control.save-control"),
      //message: 'Introduce el nuevo nombre',
      inputs: [
        {
          name: "name",
          placeholder: this.translate.instant("add-control.new-name"),
          value: name,
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
            if (!(data.name.length && data.name.length < 30)) {
              this.alert(
                this.translate.instant("controls.invalid-name"),
                this.translate.instant("controls.invalid-name-msg")
              );
              return false;
            }
            controldef.name = data.name;
            controldef.deviceId = this.selectedDevice.id;
            this.showLoading();
            if (controldef.id === "blank") {
              // Create blank control
              this.Control.save({
                name: data.name,
                type: type,
                deviceId: this.selectedDevice.id,
                icon: "bb-remote",
              }).subscribe(
                (res) => {
                  this.viewCtrl.dismiss();
                },
                (err) =>
                  this.presentErrorPage(() => {
                    this.viewCtrl.dismiss();
                  })
              );
            } else {
              this.Control.createFromDB(controldef).subscribe(
                (res) => {
                  this.viewCtrl.dismiss();
                },
                (err) =>
                  this.presentErrorPage(() => {
                    this.viewCtrl.dismiss();
                  })
              );
            }
          },
        },
      ],
    });

    prompt.present();
  }

  configureBlastbot() {
    this.dismiss(null);
    this.events.publish("nav:configureBlastbot");
  }

  getIcon(type) {
    //console.log(type);
    if (type.id === "blank") return "bb-remote";
    if (type.icon != null) return type.icon;
    // if(type.id === 1) return 'bb-remote';
    // if(type.id === 2) return 'bb-tv';
    // if(type.id === 3) return 'bb-speaker';
    // if(type.id === 4) return 'bb-stereo';
    // if(type.id === 5) return 'bb-disc';
    // if(type.id === 6) return 'bb-ac';
    // if(type.id === 7) return 'bb-disc';
    // if(type.id === 8) return 'bb-dvr';
    // if(type.id === 9) return 'bb-vcr';
    // if(type.id === 10) return 'bb-videogame';
    // if(type.id === 11) return 'bb-media-box';
    // if(type.id === 12) return 'bb-projector';
    return "bb-remote";
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }
}
