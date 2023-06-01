import { Component, NgZone } from '@angular/core';
import {
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from 'ionic-angular';
import { DevicesPage } from '../devices/devices';
import { goBuyBlastbot } from '../../components/util/util';
import { SettingsProvider } from '../../providers/settings/settings';

@Component({
  templateUrl: 'help-item.html',
})
export class HelpItemPage {
  helpTopic: string = 'welcome';
  title: string = 'Ayuda';

  constructor(public navCtrl: NavController, public navParams: NavParams, public Setting: SettingsProvider) {
    this.helpTopic = navParams.get('topic');
    this.title = navParams.get('title');
  }

  addBB() {
    this.navCtrl.setRoot(DevicesPage, { newBlastbot: true });
  }

  buyBlastbot() {
    goBuyBlastbot(this.Setting);
  }
}
