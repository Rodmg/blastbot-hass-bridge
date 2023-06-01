import { Component } from "@angular/core";
import { NavParams, ViewController, Platform } from "ionic-angular";
import { icons } from "../../components/util/util";

@Component({
  selector: "page-select-icon",
  templateUrl: "select-icon.html",
})
export class SelectIconPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  icons: Array<string> = icons;
  icon: string;
  showNoIcon: boolean = true;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public platform: Platform
  ) {
    this.icon = this.navParams.get("icon");
    let allowNoIcon = this.navParams.get("allowNoIcon");
    if (allowNoIcon != null) this.showNoIcon = allowNoIcon;
  }

  ionViewDidEnter() {
    // Dismiss modal on back button press
    this.deregisterBackButton = this.platform.registerBackButtonAction(() => {
      this.dismiss(null);
    });
  }

  ionViewWillLeave() {
    this.deregisterBackButton();
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }
}
