import { Component } from '@angular/core';
import { ViewController, NavController, NavParams } from 'ionic-angular';

@Component({
  template: `
    <ion-list>
      <button ion-item *ngFor="let item of items" (click)="select(item)">
        <div item-left>
          <ion-icon name="{{item.icon}}"></ion-icon>
        </div>
        <h2>{{ item.name }}</h2>
      </button>
    </ion-list>
  `,
})
export class ActionPopoverPage {
  items: Array<any>;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public navCtrl: NavController
  ) {
    this.items = navParams.get('items');
  }

  close() {
    this.viewCtrl.dismiss();
  }

  select(item) {
    this.viewCtrl.dismiss({ item: item }, null, {
      animate: false,
      duration: 0,
    });
  }
}
