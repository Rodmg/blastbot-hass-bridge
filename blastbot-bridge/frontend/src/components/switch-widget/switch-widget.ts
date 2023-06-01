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
import { Switch } from '../../providers/switch/switch';
import { ProtoWidgetComponent } from '../../components/proto-widget/proto-widget';

@Component({
  selector: 'switch-widget',
  templateUrl: 'switch-widget.html',
})
export class SwitchWidgetComponent extends ProtoWidgetComponent {
  @Input() item: any;

  @Input() inEditMode: any;

  @Output() open = new EventEmitter<any>();
  @Output() shareControl = new EventEmitter<any>();
  @Output() editControl = new EventEmitter<any>();
  @Output() deleteControl = new EventEmitter<any>();

  constructor(
    public zone: NgZone,
    public Switch: Switch,
    public toastCtrl: ToastController,
    public translate: TranslateService
  ) {
    super(zone, toastCtrl, translate);
  }

  set(state, i) {
    this.loading = true;
    // For avoiding update on websocket event on control list view while loading
    this.item.avoidUpdate = true;
    let past_state = this.item.switches[0].state;
    this.item.switches[0].state = state;
    let data = {
      command: 'on',
    };

    if (state === true) data.command = 'on';
    else data.command = 'off';

    this.showLoading();

    this.Switch.execute({ id: this.item.switches[0].id, body: data }).subscribe(
      res => {
        //console.log(res);
      },
      err => {
        //this.hideLoading();
        if (err.status === 504)
          this.notify(this.translate.instant('switch.no-communication'));
        //else this.presentErrorPage(() => { this.load(true, null) });  // Retry after presenting error
        this.item.switches[0].state = past_state;
        this.item.avoidUpdate = false;
      },
      () => {
        this.item.avoidUpdate = false;
        this.hideLoading();
      }
    );
  }

  onOpen(item, type) {
    this.open.emit([item, type]);
  }

  onShareControl(item, type) {
    this.shareControl.emit([item, type]);
  }

  onEditControl(item, type) {
    this.editControl.emit([item, type]);
  }

  onDeleteControl(item, type) {
    this.deleteControl.emit([item, type]);
  }
}
