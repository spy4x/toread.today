import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../list/list.component';

export interface ItemAddEvent {
  urls: string,
  tags: string[],
  isSingle: boolean
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
  inputTags: string[] = [];
  isSingleURL = true;
  errors: string[] = [];

  add(): void {
    if(!this.isUrl(this.inputValue)) {
      this.errors = [...this.errors, `${this.inputValue} is not a valid URL`];
      return;
    }
    const item: ItemAddEvent = {
      urls: this.inputValue,
      tags: this.inputTags,
      isSingle: this.isSingleURL
    };
    this.addItem.emit(item);
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
