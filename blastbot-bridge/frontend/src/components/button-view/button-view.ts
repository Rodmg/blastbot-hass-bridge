import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
} from '@angular/core';

function getBlankButton() {
  return {
    blank: true,
    last: false,
  };
}

/**
 * Complex workflow, needs to be documented.
 */
export function prepareButtons(buttons) {
  buttons = buttons.sort(function(a, b) {
    if (a.order == null) return -1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });
  for (let i = -1; i < buttons.length - 1; i++) {
    // Look for discontinuities and add blank
    let next = i + 1;
    let diff;
    if (i === -1)
      diff = buttons[next].order - -1; // Special case for fisrt button
    else diff = buttons[next].order - buttons[i].order;
    diff--;
    if (diff > 0) {
      for (let j = 0; j < diff; j++) {
        buttons.splice(next, 0, getBlankButton());
      }
    }
  }
  let blank = getBlankButton();
  blank.last = true;
  buttons.push(blank);
  return buttons;
}

@Component({
  selector: 'button-view',
  templateUrl: 'button-view.html',
})
export class ButtonViewComponent {
  private _inEditMode: boolean = false;

  @Input() buttons: Array<any>;
  @Input()
  set inEditMode(inEditMode: boolean) {
    this._inEditMode = inEditMode;
    this.setSortable(this._inEditMode);
  }
  get inEditMode(): boolean {
    return this._inEditMode;
  }

  @Output() onPress = new EventEmitter<boolean>();

  sortableOptions: any = {
    animation: 300,
    delay: 200,
    ghostClass: 'control-button-ghost',
    chosenClass: 'control-button-chosen',
    disabled: true,
    onSort: evt => this.onSort(evt),
  };

  constructor(public changeDetector: ChangeDetectorRef) {}

  buttonClass(button) {
    let buttonClass = '';
    if (button.blank)
      this.inEditMode
        ? (buttonClass += ' control-button-blank-show ')
        : (buttonClass += ' control-button-blank ');
    else {
      this.inEditMode
        ? (buttonClass += ` control-button-edit ${button.color} `)
        : (buttonClass += button.busy ? ' gray ' : button.color);
    }
    return buttonClass;
  }

  setSortable(isSortable) {
    // We need to pass a whole new object for this to work
    let opts = JSON.parse(JSON.stringify(this.sortableOptions));
    opts.disabled = !isSortable;
    opts.onSort = evt => this.onSort(evt);
    this.sortableOptions = opts;
  }

  reassignOrder() {
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].blank) continue;
      if (this.buttons[i].order !== i) {
        this.buttons[i].order = i;
        this.buttons[i].changed = true;
      }
    }
  }

  onSort(evt) {
    let movedItem = this.buttons[evt.newIndex];
    if (movedItem == null) return;
    let lastindex = this.buttons.length - 1;

    if (movedItem.blank) {
      if (movedItem.last && this.buttons.indexOf(movedItem) !== lastindex) {
        movedItem.last = false;
        let blank = getBlankButton();
        blank.last = true;
        this.buttons.push(blank);
      }
    } else if (this.buttons.indexOf(movedItem) === lastindex) {
      // Clear last buttons
      for (let i = 0; i < this.buttons.length; i++)
        if (this.buttons[i].blank) this.buttons[i].last = false;
      let blank = getBlankButton();
      blank.last = true;
      this.buttons.push(blank); // Add new last button
    }
    this.reassignOrder();

    // Detect contiguous blank buttons at the end and leave just one
    for (let i = this.buttons.length - 2; i >= 0; i--) {
      if (!this.buttons[i].blank) break;
      else this.buttons.pop();
    }
    this.buttons[this.buttons.length - 1].last = true;

    // Force UI change detection
    this.changeDetector.detectChanges();
  }

  press(button) {
    this.onPress.emit(button);
  }
}
