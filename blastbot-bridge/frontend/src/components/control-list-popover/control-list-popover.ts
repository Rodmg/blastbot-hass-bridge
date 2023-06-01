import {
  NavController,
  ViewController,
  PopoverController,
} from 'ionic-angular';
import { ControlPopoverPage } from '../../pages/control-popover/control-popover';
import { SmartControlPage } from '../../pages/smart-control/smart-control';
import { ControlPage } from '../../pages/control/control';
import { SwitchPage } from '../../pages/switch/switch';

// Note: This class is not injectable, should be instantiated on a page controller

export class ControlListPopover {
  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public popoverCtrl: PopoverController
  ) {}

  popover(event, controls) {
    let popover = this.popoverCtrl.create(ControlPopoverPage, {
      controls: controls,
    });

    popover.onDidDismiss(data => {
      if (data == null) return;
      let type = data.type;
      let control = data.control;

      let isShared = false;
      if (type === 'shared') {
        isShared = true;
        type = control.sharedControl.type;
      }

      // this.navCtrl.pop({ animate: false });
      if (type === 'ir')
        this.navCtrl
          .push(
            ControlPage,
            { controls: controls, control: control, shared: isShared },
            { animate: false }
          )
          .then(() => {
            const index = this.viewCtrl.index;
            this.navCtrl.remove(index);
          });
      else if (type === 'ac')
        this.navCtrl
          .push(
            SmartControlPage,
            { controls: controls, control: control, shared: isShared },
            { animate: false }
          )
          .then(() => {
            const index = this.viewCtrl.index;
            this.navCtrl.remove(index);
          });
      else if (type === 'switch')
        this.navCtrl
          .push(
            SwitchPage,
            { controls: controls, control: control, shared: isShared },
            { animate: false }
          )
          .then(() => {
            const index = this.viewCtrl.index;
            this.navCtrl.remove(index);
          });
    });

    popover.present({
      ev: event,
      animate: false,
    });
  }
}
