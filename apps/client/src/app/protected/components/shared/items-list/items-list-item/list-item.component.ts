import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item, ItemRating, Tag } from '../../../../interfaces';
import {
  SetItemCommentEvent,
  SetItemPriorityEvent,
  SetItemRatingEvent, SetItemTitleEvent, SetItemURLEvent,
  ToggleItemFavouriteEvent,
  ToggleItemTagEvent,
  ToggleTagEvent
} from '../list.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
  @Output() changeRating = new EventEmitter<SetItemRatingEvent>();
  @Output() changeComment = new EventEmitter<SetItemCommentEvent>();
  @Output() setPriority = new EventEmitter<SetItemPriorityEvent>();
  @Output() setTitle = new EventEmitter<SetItemTitleEvent>();
  @Output() setURL = new EventEmitter<SetItemURLEvent>();
  isNoteVisible = false;

  constructor(private sanitizer: DomSanitizer) {}

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

  editTitle(item: Item): void {
    const title = prompt(`Edit title for "${item.url}":`, item.title || '');
    if (!title || item.title === title) {
      return;
    }
    this.setTitle.emit({item, title});
  }

  editURL(item: Item): void {
    const url = prompt(`Edit URL for "${item.title}":`, item.url || '');
    if (!url || item.url === url) {
      return;
    }
    this.setURL.emit({item, url});
  }

  getURL(item: Item): SafeUrl {
    const url = item.url.includes('://') ? item.url : `//${item.url}`;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
