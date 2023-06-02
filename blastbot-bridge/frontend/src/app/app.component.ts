import { Component, ViewChild } from "@angular/core";
import { Platform, Nav, Config, MenuController } from "ionic-angular";
import { Events } from "ionic-angular";

import { ControlsPage } from "../pages/controls/controls";
import { DevicesPage } from "../pages/devices/devices";
import { BlankPage } from "../pages/blank/blank";

import { AudioComponent } from "../components/audio/audio";
import { LocalStorage } from "../components/local-storage/local-storage";

import { TranslateService } from "@ngx-translate/core";
import { SettingsProvider } from "../providers/settings/settings";
import { RESTORE_DEVICE_SETUP_KEY } from "../components/util/util";

@Component({
  templateUrl: "app.html",
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = BlankPage;

  pages: Array<{
    title: string;
    icon: string;
    component: any;
    logout: boolean;
    params?: any;
  }>;

  swipeBackEnabled: boolean = true;
  hideSideMenu: boolean = false;
  showingLogin: boolean = false;

  constructor(
    public platform: Platform,
    public config: Config,
    public events: Events,
    public AudioComponent: AudioComponent,
    public menuController: MenuController,
    public translate: TranslateService,
    public settings: SettingsProvider,
    public localStorage: LocalStorage
  ) {
    this.translate.setDefaultLang("en");
    this.guessLanguage();

    this.initializeApp();

    // Manually trigger socket:change event for polling
    setInterval(() => {
      this.events.publish("socket:change", { model: "device" });
    }, 2000);
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    this.translate
      .get([
        "main.dashboard",
        "main.scenes",
        "main.configure-new-device",
        "main.manage-devices",
        "main.automation",
        "main.preferences",
        "main.help",
        "main.close-session",
        "back",
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ])
      .subscribe((res: any) => {
        // side menu contents
        this.pages = [
          {
            title: res["main.dashboard"],
            icon: "game-controller-a",
            component: ControlsPage,
            logout: false,
          },
          {
            title: res["main.manage-devices"],
            icon: "bb-blastbot",
            component: DevicesPage,
            logout: false,
          },
        ];
        this.config.set("ios", "backButtonText", res["back"]);
        this.config.set("monthNames", [
          res["january"],
          res["february"],
          res["march"],
          res["april"],
          res["may"],
          res["june"],
          res["july"],
          res["august"],
          res["september"],
          res["october"],
          res["november"],
          res["december"],
        ]);
        this.config.set("monthShortNames", [
          res["january"].substr(0, 3),
          res["february"].substr(0, 3),
          res["march"].substr(0, 3),
          res["april"].substr(0, 3),
          res["may"].substr(0, 3),
          res["june"].substr(0, 3),
          res["july"].substr(0, 3),
          res["august"].substr(0, 3),
          res["september"].substr(0, 3),
          res["october"].substr(0, 3),
          res["november"].substr(0, 3),
          res["december"].substr(0, 3),
        ]);
      });
  }

  guessLanguage() {
    let lang = this.translate.getBrowserLang();
    if (lang !== "es") lang = "en";
    this.setLanguage(lang);
  }

  init() {
    // Manage go to configure blastbot from anywhere
    this.events.subscribe("nav:configureBlastbot", () => {
      this.nav.setRoot(DevicesPage, { newBlastbot: true });
    });

    this.events.subscribe("nav:setSwipeEnabled", (enabled: boolean) => {
      this.setSwipeEnabled(enabled);
    });

    this.events.subscribe("nav:setSideMenuHidden", (hidden: boolean) => {
      this.setSideMenuHidden(hidden);
    });

    this.events.subscribe("settings:changed", (profile: any) => {
      this.setLanguage(profile.locale);
    });

    this.events.subscribe("language:set", (lang: string) => {
      this.setLanguage(lang);
    });

    this.goControlsOrWelcome();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      this.localStorage.native(false);
      this.AudioComponent.initAudioWeb();

      this.init();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (page.params == null) this.nav.setRoot(page.component);
    else this.nav.setRoot(page.component, page.params);
  }

  async goControlsOrWelcome() {
    const resumeDeviceSetup = await this.localStorage.get(
      RESTORE_DEVICE_SETUP_KEY
    );

    // Functionality for resuming device setup if the app gets reloaded in the middle of the flow
    // Rest of the logic lives in proto-setup-wifi
    if (resumeDeviceSetup != null) {
      this.nav.setRoot(DevicesPage, { newBlastbot: true });
      return;
    }

    this.nav.setRoot(ControlsPage);
  }

  setSwipeEnabled(enabled: boolean) {
    this.swipeBackEnabled = enabled;
    this.menuController.swipeEnable(enabled, "sideMenu");
  }

  setSideMenuHidden(hidden: boolean) {
    this.hideSideMenu = hidden;
  }

  isSideMenuHidden(): boolean {
    return this.hideSideMenu;
  }
}
