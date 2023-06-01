import { Component } from '@angular/core';
import { ViewController, NavController, NavParams } from 'ionic-angular';

@Component({
  template: `
    <ion-list>
      <ion-list-header>{{ 'controls.title' | translate }}</ion-list-header>
      <button ion-item *ngFor="let control of controls" (click)="select(control.type, control)">
        {{ control.type === 'shared' ? control.sharedControl.name : control.name }}
      </button>
    </ion-list>
  `,
})
export class ControlPopoverPage {
  controls: Array<any>;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public navCtrl: NavController
  ) {
    this.controls = navParams.get('controls');
  }

  close() {
    this.viewCtrl.dismiss();
  }

  select(type, control) {
    this.viewCtrl.dismiss({ type: type, control: control }, null, {
      animate: false,
      duration: 0,
    });
  }
}
