import { Component, NgZone } from '@angular/core';
import {
  NavController,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from 'ionic-angular';
import { HelpItemPage } from '../help-item/help-item';
import { TranslateService } from '@ngx-translate/core';

@Component({
  templateUrl: 'help.html',
})
export class HelpPage {
  items: Array<any>;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService
  ) {
    this.items = [
      {
        name: this.translate.instant('help.welcome'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.welcome'),
          topic: 'welcome',
        },
      },
      {
        name: this.translate.instant('help.controls'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.edit-controls'),
          topic: 'controls',
        },
      },
      {
        name: this.translate.instant('help.share-controls'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.share-controls'),
          topic: 'share',
        },
      },
      {
        name: this.translate.instant('help.configure-new-blastbot'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.configure-blastbot'),
          topic: 'new-blastbot',
        },
      },
      {
        name: this.translate.instant('help.configure-blastbot-again'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.reconfigure-blastbot'),
          topic: 'reconfigure-blastbot',
        },
      },
      {
        name: this.translate.instant('help.tasks'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.using-tasks'),
          topic: 'tasks',
        },
      },
      {
        name: this.translate.instant('help.scenes'),
        controller: HelpItemPage,
        params: {
          title: this.translate.instant('help.using-scenes'),
          topic: 'scenes',
        },
      },
    ];
  }

  itemSelected(item: any) {
    this.navCtrl.push(item.controller, item.params);
  }
}
