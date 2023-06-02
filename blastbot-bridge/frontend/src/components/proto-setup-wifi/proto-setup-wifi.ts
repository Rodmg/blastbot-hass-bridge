import {
  NavController,
  NavParams,
  LoadingController,
  AlertController,
  ViewController,
  Platform,
  ToastController,
} from "ionic-angular";
import { Http, Response, Headers } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Device } from "../../providers/device/device";
import { TranslateService } from "@ngx-translate/core";
import "rxjs/add/operator/toPromise";
import { LocalStorage } from "../local-storage/local-storage";
import { RESTORE_DEVICE_SETUP_KEY } from "../util/util";

// Global variable, should be available in scope
declare var blastbotCloudServer: any;
declare var blastbotHttpConfigServer: any;

export abstract class ProtoSetupWifiPage {
  abstract baseTranslateClass: string;
  images: any = {
    page1: "",
    page2: "",
    page3: "",
  };

  net = null; //Used on netAutoDetect and unsubscribe when the config is over
  SSIDinterval: any; //Used to stop the plugin from fetching SSID on netAutoDetect
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  loader: any;
  loading: boolean = false;
  isModal: boolean = false;

  currentPage: number = 1;
  configAddr: string = "http://192.168.4.1:555/";
  deviceId: any = null; // Device id if reconfiguring
  isReconfiguring: boolean = false;

  ssids: Array<any>;
  mac: string;

  selectedSsid: any;
  locationAllowed: boolean = true;
  showButtonNotPermission: boolean;
  wifiInterval: any;
  currentSSID: any;
  found_blasts: Array<any>;
  isAndroid: boolean = false;

  config: any = {
    ssid: "",
    bssid: "",
    password: "",
    passwordRepeat: "",
    ui: false,
    dhcp: true,
    ip: "255.255.255.255",
    gateway: "255.255.255.255",
    subnet: "255.255.255.255",
    udid: "",
    token: "",
    type: "",
    mqttBroker: blastbotCloudServer.brokerUrl, //"cloud.blastbot.io"
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
    public toastController: ToastController,
    public localStorage: LocalStorage
  ) {
    this.deviceId = navParams.get("deviceId");
    if (this.deviceId == null) this.deviceId = null;
    else this.isReconfiguring = true;

    this.isModal = navParams.get("isModal");
    if (this.isModal == null) this.isModal = false;

    this.checkResumeDeviceSetup();
  }

  ionViewDidEnter() {
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      if (this.loading) return;
      if (this.currentPage > 1) this.back();
      else this.dismiss(null);
    });
    if (this.platform.is("android")) {
      this.isAndroid = true;
    } else {
      this.isAndroid = false;
    }
  }

  ionViewWillLeave() {
    this.deregisterBackButton();
    // Disable restoring of the device setup if we exit on purpose
    this.localStorage.remove(RESTORE_DEVICE_SETUP_KEY);
  }

  async checkResumeDeviceSetup() {
    let resumeDeviceSetup = await this.localStorage.get(
      RESTORE_DEVICE_SETUP_KEY
    );

    if (resumeDeviceSetup == null) {
      return;
    }
    try {
      resumeDeviceSetup = JSON.parse(resumeDeviceSetup);
    } catch (err) {
      console.error("ProtoSetupWifi: Error resuming device setup", err);
      await this.localStorage.remove(RESTORE_DEVICE_SETUP_KEY);
      this.dismiss(null);
    }

    this.config.udid = resumeDeviceSetup.udid;
    this.config.token = resumeDeviceSetup.token;
    this.config.type = resumeDeviceSetup.type;

    this.currentPage = 4;
    this.showButtonNotPermission = true;
  }

  presentLoader(msg: string) {
    this.loading = true;
    this.loader = this.loadingController.create({
      content: msg,
    });
    this.loader.present();
  }

  dismissLoader() {
    this.loading = false;
    if (this.loader) this.loader.dismiss();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }

  abstract goToHttpConfigPage();

  goToHttpConfigPageType(type: string) {
    window.location.assign(
      blastbotHttpConfigServer +
        "#/?udid=" +
        this.config.udid +
        "&token=" +
        this.config.token +
        "&broker=" +
        this.config.mqttBroker +
        "&type=" +
        type +
        "&isReconfiguring=" +
        this.isReconfiguring +
        "&backurl=" +
        blastbotCloudServer.protocol +
        "://" +
        blastbotCloudServer.url +
        blastbotCloudServer.port
    );
  }

  connectionLostBlastbotError(callback) {
    let prompt = this.alertController.create({
      title: this.translate.instant(
        `${this.baseTranslateClass}.blastbot-connection-lost`
      ),
      message: this.translate.instant(
        `${this.baseTranslateClass}.blastbot-connection-lost-msg`
      ),
      buttons: [
        {
          text: this.translate.instant("setup-blastbot.go-back"),
          role: "cancel",
        },
        {
          text: this.translate.instant("setup-blastbot.retry"),
          handler: () => {
            callback();
          },
        },
      ],
    });
    prompt.present();
  }

  searchNetworksError(callback) {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-blastbot.there-was-a-problem"),
      message: this.translate.instant("setup-blastbot.no-networks"),
      buttons: [
        {
          text: this.translate.instant("setup-blastbot.go-back"),
          role: "cancel",
        },
        {
          text: this.translate.instant("setup-blastbot.retry"),
          handler: () => {
            callback();
          },
        },
      ],
    });
    prompt.present();
  }

  noInternetError(callback) {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-blastbot.no-internet"),
      message: this.translate.instant("setup-blastbot.no-internet-msg"),
      enableBackdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant("setup-blastbot.retry"),
          handler: () => {
            callback();
          },
        },
      ],
    });
    prompt.present();
  }

  async netCheck() {
    this.showButtonNotPermission = false;
    if (this.currentPage === 4) {
      // Wait 5 seconds and show the Next button
      setTimeout(() => (this.showButtonNotPermission = true), 5000);

      // This can be unreliable
      // if (this.platform.is("core") || this.platform.is("mobileweb")) {
      //   this.net = this.network.onConnect().subscribe(() => {
      //     //Non-smart next, it will attempt a Next on ANY network change
      //     setTimeout(() => this.next(), 5000);
      //   });
      //   return;
      // }
    } else {
      this.killSubscriptions();
    }
  }

  setOffPermission() {
    if (this.platform.is("android")) this.locationAllowed = false;
    this.showButtonNotPermission = true;
  }

  setOnPermission() {
    this.locationAllowed = true;
  }

  killSubscriptions() {
    if (
      (this.platform.is("core") || this.platform.is("mobileweb")) &&
      this.net != null
    )
      this.net.unsubscribe();
    if (this.wifiInterval != null) clearInterval(this.wifiInterval);
  }

  async next() {
    if (this.currentPage === 3) {
      this.presentLoader(this.translate.instant("loading"));
      this.getOrCreateDevice().subscribe(
        (res) => {
          /*
            Check if we are in web app (https).
            In that case, we need to go to the http configure
            page for successfully ending the configuration
            (Avoiding SSL security warnings in browser).
          */
          if (window.location.protocol === "https:")
            return this.goToHttpConfigPage();
          this.currentPage++;
          this.netCheck();
        },
        (err) => {
          console.error(err);
          this.dismissLoader();
          this.noInternetError(() => {
            this.next();
          });
        },
        () => {
          this.dismissLoader();
        }
      );
      return;
    }
    if (this.currentPage === 4 && !this.loading) {
      try {
        this.presentLoader(
          this.translate.instant(
            `${this.baseTranslateClass}.searching-blastbot`
          )
        );
        const networks = await this.searchDevice().toPromise();

        if (this.isErrorSSIDList(networks)) throw networks;

        await this.getCurrentConfig().toPromise();
        this.dismissLoader();
        this.currentPage++;
      } catch (err) {
        this.searchNetworksError(() => this.searchMoreNetworks());
        this.dismissLoader();
        this.currentPage++;
      }
      return;
    }
    this.currentPage++;
  }

  back() {
    if (this.currentPage > 1) this.currentPage--;
    this.netCheck();
  }

  async searchMoreNetworks() {
    this.presentLoader(
      this.translate.instant("setup-blastbot.searching-networks")
    );
    try {
      const networks = await this.searchDevice().toPromise();

      if (this.isErrorSSIDList(networks)) throw networks;

      this.initializeSsidSelect();
      this.dismissLoader();
    } catch (err) {
      this.dismissLoader();
      this.searchNetworksError(() => {
        this.searchMoreNetworks();
      });
    }
  }

  parseIpString(ip: string) {
    return ip.split(".");
  }

  validateIp(ip: string) {
    let patt = new RegExp(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    );
    return patt.test(ip);
  }

  abstract getOrCreateDevice();

  getOrCreateDeviceType(type: string) {
    if (this.deviceId == null) {
      // Create device
      return Observable.create((observer) => {
        this.Device.save({ type: type }).subscribe(
          (res) => {
            this.config.udid = res.udid;
            this.config.token = res.token;
            this.config.type = res.type;
            // Setup for resuming config if the app reloads
            this.localStorage.set(
              RESTORE_DEVICE_SETUP_KEY,
              JSON.stringify({
                udid: res.udid,
                token: res.token,
                type: res.type,
              })
            );
            observer.next(res);
          },
          (err) => observer.error(err),
          () => observer.complete()
        );
      });
    } else {
      // Get device
      return Observable.create((observer) => {
        this.Device.get({ id: this.deviceId }).subscribe(
          (res) => {
            this.config.udid = res.udid;
            this.config.token = res.token;
            this.config.type = res.type;
            // Setup for resuming config if the app reloads
            this.localStorage.set(
              RESTORE_DEVICE_SETUP_KEY,
              JSON.stringify({
                udid: res.udid,
                token: res.token,
                type: res.type,
              })
            );
            observer.next(res);
          },
          (err) => {
            observer.error(err);
          },
          () => observer.complete()
        );
      });
    }
  }

  searchDevice() {
    return Observable.create((observer) => {
      this.http
        .get(this.configAddr + "scan")
        .timeout(10000)
        .map((res: Response) => res.json())
        .subscribe(
          (res) => {
            this.ssids = res.results.sort(function (a, b) {
              return b.rssi - a.rssi;
            }); // Order by signal
            observer.next(res);
          },
          (err) => {
            this.ssids = [];
            observer.next(err); // Ignore failure to get ssids, should fix problems with some clients
            observer.complete();
          },
          () => {
            this.killSubscriptions();
            observer.complete();
          }
        );
    });
  }

  initializeSsidSelect() {
    // First, try to search by bssid
    let found = false;
    if (
      this.config.bssid != null &&
      this.config.bssid != "" &&
      this.config.bssid !== "FF:FF:FF:FF:FF:FF"
    ) {
      for (let net of this.ssids) {
        if (net.bssid === this.config.bssid) {
          found = true;
          this.selectedSsid = net;
          break;
        }
      }
    } else {
      // Search by ssid
      for (let net of this.ssids) {
        if (net.ssid === this.config.ssid) {
          found = true;
          this.selectedSsid = net;
          break;
        }
      }
    }

    if (!found) {
      // create net item if not found
      let net = {
        ssid: this.config.ssid,
        bssid: this.config.bssid,
      };
      this.ssids.push(net);
      this.selectedSsid = net;
    }
  }

  abstract isCorrectDeviceType(type: string): boolean;

  getCurrentConfig() {
    return Observable.create((observer) => {
      this.http
        .get(this.configAddr + "configure")
        .timeout(10000)
        .map((res: Response) => res.json())
        .subscribe(
          (res) => {
            this.config.ssid = res.ssid;
            this.config.bssid = res.bssid;
            this.config.password = res.pass;
            this.config.passwordRepeat = res.pass;
            this.config.ui = res.ui;
            this.config.dhcp = res.dhcp;
            this.config.ip = res.ip;
            this.config.gateway = res.gateway;
            this.config.subnet = res.subnet;
            // Make sure this is a device of the correct type
            if (!this.isCorrectDeviceType(res.type))
              return observer.error(new Error("Incorrect device type"));
            this.config.type = res.type;

            // Initialize the SSID selector
            this.initializeSsidSelect();
            observer.next(res);
          },
          (err) => {
            // Initialize the SSID selector
            this.initializeSsidSelect();
            observer.next(err); //Workaround to prevent failure loop
            observer.complete();
            // observer.error(err);
          },
          () => {
            this.killSubscriptions();
            observer.complete();
          }
        );
    });
  }

  apply() {
    // Disable restoring of the device setup if we finish the flow
    this.localStorage.remove(RESTORE_DEVICE_SETUP_KEY);

    this.presentLoader(this.translate.instant("setup-blastbot.applying"));

    let ip = this.parseIpString(this.config.ip);
    let gateway = this.parseIpString(this.config.gateway);
    let subnet = this.parseIpString(this.config.subnet);

    let data: any = {
      ssid: this.config.ssid,
      bssid: this.config.bssid,
      pass: this.config.password,
      ui: this.config.ui ? "checked" : "", // Formatting for post form. Fixes partially #8
      dhcp: this.config.dhcp ? "checked" : "", // Formatting for post form. Fixes partially #8
      ip0: ip[0],
      ip1: ip[1],
      ip2: ip[2],
      ip3: ip[3],
      g0: gateway[0],
      g1: gateway[1],
      g2: gateway[2],
      g3: gateway[3],
      s0: subnet[0],
      s1: subnet[1],
      s2: subnet[2],
      s3: subnet[3],
      broker: this.config.mqttBroker,
      udid: this.config.udid,
      token: this.config.token,
    };

    // Prepare body as urlencoded string
    let body: string;
    let bodyTemp: Array<string> = [];
    for (var p in data) {
      bodyTemp.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
    }
    body = bodyTemp.join("&");

    let headers: Headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    this.http
      .post(this.configAddr + "configure", body, { headers: headers })
      .subscribe(
        (res) => {
          this.dismissLoader();
          this.checkAndGo();
        },
        (err) => {
          console.error(err);
          this.dismissLoader();
          this.checkAndGo();
          this.presentToast();
        },
        () => {}
      );
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant(
        "setup-blastbot.blastbot-connection-lost"
      ),
      duration: 5000,
      showCloseButton: true,
      closeButtonText: this.translate.instant("close"),
    });
    toast.present();
  }

  checkAndGo() {
    this.presentLoader(
      this.translate.instant("setup-blastbot.waiting-network")
    );
    setTimeout(() => {
      this.checkInternet((err) => {
        this.dismissLoader();
        if (err)
          return this.noInternetError(() => {
            this.checkAndGo();
          });
        this.dismiss(null);
      });
    }, 15000);
  }

  checkInternet(callback) {
    let url = "https://cloud.blastbot.io";
    this.http
      .get(url)
      .timeout(5000)
      .subscribe(
        (res) => {
          callback(null);
        },
        (err) => {
          callback(err);
        },
        () => {}
      );
  }

  alert(title, message, subtitle = "") {
    let alert = this.alertController.create({
      title: title,
      subTitle: subtitle,
      message: message,
      buttons: [this.translate.instant("ok")],
    });
    alert.present();
  }

  addSsid() {
    let prompt = this.alertController.create({
      title: this.translate.instant("setup-blastbot.other-ssid"),
      //message: 'Introduce el nuevo nombre',
      inputs: [
        {
          name: "ssid",
          placeholder: "SSID",
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
            if (!(data.ssid.length && data.ssid.length < 31)) {
              this.alert(
                this.translate.instant("setup-blastbot.invalid-name"),
                this.translate.instant("setup-blastbot.invalid-name-msg")
              );
              return false;
            }
            let newSsid = { ssid: data.ssid, bssid: "" };
            this.ssids.push(newSsid);
            this.selectedSsid = newSsid;
            this.config.ssid = newSsid.ssid;
            this.config.bssid = "";
          },
        },
      ],
    });

    prompt.present();
  }

  ssidSelectChanged($event) {
    if ($event.ssid != null) this.config.ssid = $event.ssid;
    else this.config.ssid = "";
    if ($event.bssid != null) this.config.bssid = $event.bssid;
    else this.config.bssid = "";
    if (this.config.ssid.length === 0) this.addSsid();
  }

  validate() {
    if (!this.config.ssid.length) return false;
    if (this.config.password.length > 64) return false;
    if (this.config.passwordRepeat !== this.config.password) return false;
    if (!this.config.dhcp) {
      if (!this.validateIp(this.config.ip)) return false;
      if (!this.validateIp(this.config.subnet)) return false;
      if (!this.validateIp(this.config.gateway)) return false;
    }
    return true;
  }

  rssiToPercent(rssi) {
    let pc = 2 * (rssi + 100);
    if (pc > 100) pc = 100;
    return pc;
  }

  isErrorSSIDList(networks) {
    return !networks || !networks.results;
  }
}
