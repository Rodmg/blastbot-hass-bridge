import {
  Component,
  EventEmitter,
  Input,
  Output,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';

declare const Hammer: any;

@Component({
  selector: 'switch-view',
  templateUrl: 'switch-view.html',
})
export class SwitchViewComponent {
  @Input() switch: any;
  @Input() loading: boolean = false;

  @Input() direction: string; //'horizontal', 'horizontal-sm' or 'vertical'

  @Output() onToggle = new EventEmitter<boolean>();

  // Swipe gestures support
  hmr: any;
  hmrOnSwipe: any;
  hmrOnTap: any;

  ngAfterViewInit() {
    let toggleSwitch = this.elRef.nativeElement.querySelector('#toggle-switch');
    this.hmr = new Hammer(toggleSwitch, {
      recognizers: [
        [Hammer.Tap],
        [
          Hammer.Swipe,
          {
            direction:
              this.direction === 'horizontal' ||
              this.direction === 'horizontal-sm'
                ? Hammer.DIRECTION_HORIZONTAL
                : Hammer.DIRECTION_VERTICAL,
          },
        ],
      ],
    });

    this.hmrOnSwipe = ev => {
      if (
        this.direction === 'horizontal' ||
        this.direction === 'horizontal-sm'
      ) {
        if (ev.deltaX < 0) this.zone.run(() => this.onToggle.emit(false));
        else if (ev.deltaX > 0) this.zone.run(() => this.onToggle.emit(true));
      } else {
        if (ev.deltaY > 0) this.zone.run(() => this.onToggle.emit(false));
        else if (ev.deltaY < 0) this.zone.run(() => this.onToggle.emit(true));
      }
    };

    this.hmrOnTap = ev => {
      ev.preventDefault();
      ev.srcEvent.stopPropagation();
      this.zone.run(() => this.onToggle.emit(!this.switch.state));
    };

    this.hmr.on('swipe', this.hmrOnSwipe);
    this.hmr.on('tap', this.hmrOnTap);
  }

  ngOnDestroy() {
    this.hmr.off('swipe', this.hmrOnSwipe);
    this.hmr.off('tap', this.hmrOnTap);
  }

  constructor(public zone: NgZone, private elRef: ElementRef) {}
}
