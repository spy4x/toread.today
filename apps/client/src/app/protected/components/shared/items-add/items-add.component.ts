import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ItemPriority, ItemRating } from '../../../interfaces';
import { ToggleTagEvent } from '../items-list/list.component';
import { ItemService, RouterHelperService, TagService } from '../../../../services';
import isURL from 'validator/es/lib/isURL';

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
  inputValue = '';
  inputTags: string[] = [];
  priority: ItemPriority = 0;
  errors: string[] = [];

  constructor(
    public tagService: TagService,
    private itemService: ItemService,
    private routerHelper: RouterHelperService,
    private cd: ChangeDetectorRef,
  ) {}

  async addItem(rating: number): Promise<void> {
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
      priority: this.priority
    };
    this.routerHelper.createItem(item);
    this.inputValue = '';
    this.inputTags = [];
    this.priority = 0;
    this.errors = [];
    this.cd.detectChanges();
  }

  toggleTag(event: ToggleTagEvent) {
    if (event.isSelected) {
      this.inputTags = [...this.inputTags, event.tagId];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.tagId);
    }
  }
}
