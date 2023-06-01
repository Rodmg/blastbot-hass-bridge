import {
  Component,
  EventEmitter,
  Input,
  Output,
  NgZone,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'ir-widget',
  templateUrl: 'ir-widget.html',
})
export class IrWidgetComponent {
  @Input() item: any;

  @Input() inEditMode: any;

  @Output() open = new EventEmitter<any>();
  @Output() shareControl = new EventEmitter<any>();
  @Output() editControl = new EventEmitter<any>();
  @Output() deleteControl = new EventEmitter<any>();

  constructor(public zone: NgZone) {}

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
