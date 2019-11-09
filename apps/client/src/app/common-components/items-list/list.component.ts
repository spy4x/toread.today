import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item, ItemRating } from '../../interfaces/item.interface';
import { Tag } from '../../interfaces/tag.interface';
import { Pagination } from '../../pages/items/pagination.interface';
import { trackByFn } from '../../helpers/trackBy.helper';

export interface ToggleTagEvent {
  tagId: string
  isSelected: boolean
}

export interface ToggleItemTagEvent extends ToggleTagEvent {
  itemId: string
}

export interface ToggleItemFavouriteEvent {
  id: string
  isFavourite: boolean
}

export interface ChangeItemRatingEvent {
  id: string
  rating: ItemRating
}

export interface ChangeItemCommentEvent {
  id: string
  comment: string
}

@Component({
  selector: 'tt-list',
  templateUrl: './list.component.pug',
  styleUrls: ['./list.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
  @Input() items: Item[];
  @Input() tags: Tag[] = [];
  @Input() pagination: Pagination;
  @Output() startReading = new EventEmitter<string>();
  @Output() finishReading = new EventEmitter<string>();
  @Output() undoReading = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() retryURLParsing = new EventEmitter<string>();
  @Output() toggleTag = new EventEmitter<ToggleItemTagEvent>();
  @Output() toggleFavourite = new EventEmitter<ToggleItemFavouriteEvent>();
  @Output() tagClick = new EventEmitter<string>();
  @Output() changeRating = new EventEmitter<ChangeItemRatingEvent>();
  @Output() changeComment = new EventEmitter<ChangeItemCommentEvent>();
  @Output() loadPrev = new EventEmitter<void>();
  @Output() loadNext = new EventEmitter<void>();
  trackByFn = trackByFn;

  isZeroItems(): boolean {
    return this.items && !this.items.length;
  }
}
