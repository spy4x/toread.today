import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item } from '../item.interface';
import { Tag } from '../tag.interface';


export interface ToggleTagEvent {
  id: string
  isSelected: boolean

}
export interface ToggleItemTagEvent extends ToggleTagEvent {
  itemId: string
}

export interface ToggleItemFavouriteEvent {
  itemId: string
  isFavourite: boolean
}

@Component({
  selector: 'tt-list',
  templateUrl: './list.component.pug',
  styleUrls: ['./list.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
  @Input() items: Item[] = [];
  @Input() tags: Tag[] = [];
  @Input() isLoading: boolean = false;
  @Input() areAllItemsLoaded: boolean = false;
  @Output() startReading = new EventEmitter<string>();
  @Output() finishReading = new EventEmitter<string>();
  @Output() undoReading = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() toggleTag = new EventEmitter<ToggleItemTagEvent>();
  @Output() toggleFavourite = new EventEmitter<ToggleItemFavouriteEvent>();
  @Output() loadMore = new EventEmitter<void>();

  toggleTagHandler(event: ToggleTagEvent, item: Item) {
    this.toggleTag.emit({ ...event, itemId: item.id });
  }

  isZeroItems(): boolean {
    return this.items && !this.items.length && !this.isLoading;
  }

  toggleFavouriteHandler(item: Item): void {
    const event: ToggleItemFavouriteEvent = { itemId: item.id, isFavourite: !item.isFavourite };
    this.toggleFavourite.emit(event);
  }
}
