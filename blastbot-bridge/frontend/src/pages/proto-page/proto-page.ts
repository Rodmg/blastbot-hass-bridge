import { Component, NgZone } from '@angular/core';
import {
  NavController,
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
} from 'ionic-angular';
import { ErrorPage } from '../error/error';
import { ControlsPage } from '../controls/controls';
import { TranslateService } from '@ngx-translate/core';

let errorActive: boolean = false;

@Component({
  templateUrl: 'proto-page.html',
})
export class ProtoPage {
  public loading: boolean;
  public loader: any;

  public resumeListener: any;

  constructor(
    public navCtrl: NavController,
    public alertController: AlertController,
    public loadingController: LoadingController,
    public modalController: ModalController,
    public toastCtrl: ToastController,
    public zone: NgZone,
    public translate: TranslateService
  ) {
    this.resumeListener = () => {
      // Execute when app resumes on ios and android
      this.zone.run(() => this.appResumed());
    };
  }

  appResumed() {
    // Reimplement in child classes
  }

  ionViewDidEnter() {
    document.addEventListener('resume', this.resumeListener, false);
  }

  ionViewWillLeave() {
    // Remove resume event listener on view exit
    document.removeEventListener('resume', this.resumeListener, false);
  }

  presentErrorPage(callback) {
    if (errorActive) return;
    errorActive = true;
    let modal = this.modalController.create(
      ErrorPage,
      {},
      {
        showBackdrop: false,
        enableBackdropDismiss: false,
      }
    );
    modal.onDidDismiss(data => {
      errorActive = false;
      if (callback) callback();
    });
    modal.present();
  }

  showLoading() {
    this.loading = true;
  }

  hideLoading() {
    this.loading = false;
  }

  showLoadingPop() {
    this.loader = this.loadingController.create({
      content: this.translate.instant('loading'),
    });
    this.loader.present();
  }

  hideLoadingPop() {
    if (this.loader) this.loader.dismiss();
  }

  alert(title, message, subtitle = '') {
    let alert = this.alertController.create({
      title: title,
      subTitle: subtitle,
      message: message,
      buttons: [this.translate.instant('ok')],
    });
    alert.present();
  }

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
}
