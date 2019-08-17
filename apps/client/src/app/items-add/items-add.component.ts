import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-items-add',
  templateUrl: './items-add.component.pug',
  styleUrls: ['./items-add.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsAddComponent {
  @Output() addItem = new EventEmitter<string>();
  inputValue = '';
  inputPlaceholder = 'Enter URL(s). One per line or split with space (separators "\\n" and " ")';
  isSingleURL = true;

  add(): void {
    if (this.inputValue) {
      const separator = /[\r\n\t\f\v ]+/; // any spaces, tabs, \n
      this.inputValue.split(separator).forEach(url => {
        const value = url.trim();
        if (!value) {
          return;
        }
        this.addItem.emit(url);
      });
    }
    this.inputValue = '';
  }
}
