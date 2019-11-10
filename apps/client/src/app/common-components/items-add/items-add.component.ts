import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';
import { ToggleTagEvent } from '../items-list/list.component';
import { isURL } from '../../helpers/isURL.helper';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { ItemPriority, ItemRating } from '../../interfaces/item.interface';

export interface ItemAddEvent {
  url: string
  tags: string[]
  rating: ItemRating
  priority: ItemPriority
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
  @Output() add = new EventEmitter<ItemAddEvent>();
  inputValue = '';
  inputTags: string[] = [];
  priority: ItemPriority = 0;
  errors: string[] = [];

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.pipe(first()).subscribe(params => {
      const url = params['url'];
      if (url) {
        this.inputValue = url;
      }
    });
  }

  addItem(rating: number): void {
    if (!this.inputValue) {
      return;
    }
    if (!isURL(this.inputValue)) {
      this.errors = [...this.errors, `${this.inputValue} is not a valid URL`];
      return;
    }
    const item: ItemAddEvent = {
      url: this.inputValue,
      tags: this.inputTags,
      rating: rating as ItemRating || 0,
      priority: this.priority,
    };
    this.add.emit(item);
    this.inputValue = '';
    this.inputTags = [];
    this.priority = 0;
  }

  toggleTag(event: ToggleTagEvent) {
    if (event.isSelected) {
      this.inputTags = [...this.inputTags, event.tagId];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.tagId);
    }
  }
}
