import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item, ItemRating } from '../../interfaces/item.interface';
import { Tag } from '../../interfaces/tag.interface';
import { Pagination } from '../../pages/items/pagination.interface';
import { UIService } from '../../services/ui.service';
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
  @Output() loadPrev = new EventEmitter<void>();
  @Output() loadNext = new EventEmitter<void>();
  @Output() tagClick = new EventEmitter<string>();
  @Output() changeRating = new EventEmitter<ChangeItemRatingEvent>();
  @Output() changeComment = new EventEmitter<ChangeItemCommentEvent>();
  openedComments: { [id: string]: boolean } = {};
  trackByFn = trackByFn;

  constructor(public uiService: UIService) {}

  toggleTagHandler(event: ToggleTagEvent, item: Item) {
    this.toggleTag.emit({ ...event, itemId: item.id });
  }

  isZeroItems(): boolean {
    return this.items && !this.items.length;
  }

  toggleFavouriteHandler(item: Item): void {
    const event: ToggleItemFavouriteEvent = { id: item.id, isFavourite: !item.isFavourite };
    this.toggleFavourite.emit(event);
  }

  setRating(id: string, rating: ItemRating): void {
    this.changeRating.emit({ id, rating });
  }

  read(item: Item): void {
    if (item.status !== 'new') {
      return;
    }
    this.startReading.emit(item.id);
  }

  setComment(id: string, comment: string): void {
    this.changeComment.emit({ id, comment });
    this.toggleComment(id, false);
  }

  toggleComment(id: string, show?: boolean): void {
    this.openedComments[id] = typeof show === 'undefined' ? !this.openedComments[id] : show;
  }

  finishReadingHandler(id: string, rating: ItemRating): void {
    this.setRating(id, rating);
    this.finishReading.emit(id);
  }
}
