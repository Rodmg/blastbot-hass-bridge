import {
  Component,
  EventEmitter,
  Input,
  Output,
  NgZone,
  ViewChild,
} from '@angular/core';
import { LoadingController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'proto-widget',
  templateUrl: 'proto-widget.html',
})
export class ProtoWidgetComponent {
  loading: boolean = false;

  constructor(
    public zone: NgZone,
    public toastCtrl: ToastController,
    public translate: TranslateService
  ) {}

  notify(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      showCloseButton: true,
      closeButtonText: this.translate.instant('close'),
      dismissOnPageChange: true,
    });

    toast.present();
  }

  hideLoading() {
    this.loading = false;
  }

  showLoading() {
    this.loading = true;
  }
}
