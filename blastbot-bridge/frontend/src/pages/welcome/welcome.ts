import { Component, NgZone } from '@angular/core';
import {
  NavController,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from 'ionic-angular';
import { ControlsPage } from '../controls/controls';
import { DevicesPage } from '../devices/devices';
import { goBuyBlastbot } from '../../components/util/util';
import { SettingsProvider } from '../../providers/settings/settings';
import { Events } from 'ionic-angular';

@Component({
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  constructor(public navCtrl: NavController, public events: Events, public Setting: SettingsProvider) { }

  ionViewDidLoad() {
    this.events.publish('nav:setSideMenuHidden', true);
  }

  ionViewWillLeave() {
    this.events.publish('nav:setSideMenuHidden', false);
  }

  dismiss() {
    this.navCtrl.setRoot(ControlsPage);
  }

  addBB() {
    this.navCtrl.setRoot(DevicesPage, { newBlastbot: true });
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }
}
