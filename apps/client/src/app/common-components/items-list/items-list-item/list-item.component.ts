import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item, ItemRating } from '../../../interfaces/item.interface';
import { Tag } from '../../../interfaces/tag.interface';
import { Pagination } from '../../../pages/items/pagination.interface';
import {
  ChangeItemCommentEvent,
  ChangeItemRatingEvent,
  ToggleItemFavouriteEvent,
  ToggleItemTagEvent,
  ToggleTagEvent
} from '../list.component';

@Component({
  selector: 'tt-list-item',
  templateUrl: './list-item.component.pug',
  styleUrls: ['./list-item.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListItemComponent {
  @Input() item: Item;
  @Input() tags: Tag[] = [];
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
  isNoteVisible = false;

  toggleTagHandler(event: ToggleTagEvent, item: Item) {
    this.toggleTag.emit({ ...event, itemId: item.id });
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
    this.toggleComment(false);
  }

  toggleComment(show?: boolean): void {
    this.isNoteVisible = typeof show === 'undefined' ? !this.isNoteVisible : show;
  }

  finishReadingHandler(id: string, rating: ItemRating): void {
    this.setRating(id, rating);
    this.finishReading.emit(id);
  }
}
