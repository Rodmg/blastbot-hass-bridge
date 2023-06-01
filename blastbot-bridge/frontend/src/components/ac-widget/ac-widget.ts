import {
  Component,
  EventEmitter,
  Input,
  Output,
  NgZone,
  ViewChild,
  DoCheck,
} from '@angular/core';
import { LoadingController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { ACSettings } from '../../providers/acsettings/acsettings';
import { ProtoWidgetComponent } from '../../components/proto-widget/proto-widget';

@Component({
  selector: 'ac-widget',
  templateUrl: 'ac-widget.html',
})
export class ACWidgetComponent extends ProtoWidgetComponent implements DoCheck {
  @Input() item: any;

  @Input() inEditMode: any;

  @Output() open = new EventEmitter<any>();
  @Output() shareControl = new EventEmitter<any>();
  @Output() editControl = new EventEmitter<any>();
  @Output() deleteControl = new EventEmitter<any>();

  switch: any = {
    state: false,
  };

  settingsShadow: any = {};
  timeout: any;

  constructor(
    public zone: NgZone,
    public ACSettings: ACSettings,
    public toastCtrl: ToastController,
    public translate: TranslateService
  ) {
    super(zone, toastCtrl, translate);
  }

  ngAfterContentInit() {
    let settings = this.item.acSettings;
    this.settingsShadow = JSON.parse(JSON.stringify(settings)); // copy

    this.getState();
  }

  // Look for changes on switch state
  ngDoCheck() {
    this.getState();
  }

  set(state, i) {
    let past_state = this.switch.state;
    this.switch.state = state;
    if (state) return this.emit('on', past_state);
    else return this.emit('off', past_state);
  }

  temperature(temp) {
    if (temp < 0) {
      temp = parseInt(this.item.acSettings.temperature) - 1;
    } else {
      temp = parseInt(this.item.acSettings.temperature) + 1;
    }

    if (
      this.item.acSettings.dictionary.limits.set.temperature.indexOf(
        temp.toString()
      ) < 0
    ) {
      // Do nothing, emit same command
    } else {
      this.item.acSettings.temperature = temp.toString();
    }

    this.emitTimeout('set');
  }

  emit(command, past_state?: boolean) {
    //this.AudioComponent.playClick();
    this.item.avoidUpdate = true;
    this.showLoading();
    let options = {
      command: command,
      options: {
        temperature: this.item.acSettings.temperature,
        fan: this.item.acSettings.fan,
      },
    };
    this.ACSettings.emit(this.item.acSettings.id, options).subscribe(
      res => {
        // validate blastbot not responding
        if (res.status != null && res.status === false) {
          this.item.acSettings = JSON.parse(
            JSON.stringify(this.settingsShadow)
          );
          this.switch.state = past_state;
          return this.notify(
            this.translate.instant('smart-control.no-communication')
          );
        }

        this.item.acSettings = res;
        if (this.item.acSettings.sleepTime != null)
          this.item.acSettings.sleepTime = new Date(
            this.item.acSettings.sleepTime
          );
        this.settingsShadow = JSON.parse(JSON.stringify(this.item.acSettings));
      },
      err => {
        this.switch.state = past_state;
        this.item.acSettings = JSON.parse(JSON.stringify(this.settingsShadow));
        if (err.status === 504)
          this.notify(this.translate.instant('smart-control.no-communication'));
        this.item.avoidUpdate = false;
        //else this.presentErrorPage(() => { this.load(true, null) });  // Retry after presenting error
      },
      () => {
        this.item.avoidUpdate = false;
        this.loading = false;
        this.getState();
        this.hideLoading();
      }
    );
  }

  emitTimeout(command) {
    if (this.timeout != null) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.emit(command, true);
      this.timeout = null;
    }, 500);
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

  getState(): boolean {
    if (
      this.item == null ||
      this.item.acSettings == null ||
      this.item.acSettings.state == null
    )
      return false;
    if (this.item.acSettings.state === 'off') this.switch.state = false;
    if (this.item.acSettings.state === 'on') this.switch.state = true;
    return this.switch.state;
  }
}
