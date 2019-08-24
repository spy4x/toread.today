import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../list/list.component';

export interface ItemAddEvent {
  url: string,
  tags: string[]
}

@Component({
  selector: 'tt-items-add',
  templateUrl: './items-add.component.pug',
  styleUrls: ['./items-add.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsAddComponent {
  @Input() tags: Tag[] = [];
  @Output() addItem = new EventEmitter<ItemAddEvent>();
  inputValue = '';
  inputPlaceholder = 'Enter URL(s). One per line or split with space (separators "\\n" and " ")';
  inputTags: string[] = [];
  isSingleURL = true;
  errors: string[] = [];

  add(): void {
    if (this.inputValue) {
      const separator = /[\r\n\t\f\v ]+/; // any spaces, tabs, \n
      const urls = this.inputValue.split(separator);
      urls.forEach(url => {
        const value = url.trim();
        if (!value) {
          return;
        }
        if(!this.isUrl(value)) {
          this.errors = [...this.errors, `${value} is not a valid URL`];
          return;
        }
        const item: ItemAddEvent = {
          url: value,
          tags: this.inputTags,
        };
        this.addItem.emit(item);
      });
    }
    this.inputValue = '';
    this.inputTags = [];
  }

  toggleTag(event: ToggleTagEvent) {
    if (event.isSelected) {
      this.inputTags = [...this.inputTags, event.id];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.id);
    }
  }

  isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }
}
