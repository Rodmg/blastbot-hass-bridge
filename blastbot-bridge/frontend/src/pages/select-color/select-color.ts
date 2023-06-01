import { Component } from "@angular/core";
import { NavParams, ViewController, Platform } from "ionic-angular";
import { colors } from "../../components/util/util";

@Component({
  selector: "page-select-color",
  templateUrl: "select-color.html",
})
export class SelectColorPage {
  // Dismiss modal on back button press support
  deregisterBackButton: any;

  colors: Array<string> = colors;
  color: string;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public platform: Platform
  ) {
    this.color = this.navParams.get("color");
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
