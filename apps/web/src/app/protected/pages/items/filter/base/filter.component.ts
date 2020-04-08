import { EventEmitter, Input, Output } from '@angular/core';
import { ItemPriority, ItemsCounter, ItemStatus, Tag } from '../../../../interfaces';
import { ToggleTagEvent } from '../../../../components/shared/items-list/list.component';
import { RequestParams } from '../../../../../services';
import { defaultFilter } from './filter.interface';
import { trackByFn } from '../../../../helpers';

export class ItemsFilterBaseComponent {
  @Input() tags: Tag[];
  @Input() counter: ItemsCounter;
  @Input() params: RequestParams;
  @Output() changed = new EventEmitter<RequestParams>();
  trackByFn = trackByFn;

  toggleTag(event: ToggleTagEvent) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        tagId: event.isSelected ? event.tagId : null
      }
    });
  }

  setTag(tagId: null | string) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        tagId
      }
    });
  }

  setStatus(status: 'all' | 'random' | 'readToday' | ItemStatus) {
    const filter =
      status === 'random'
        ? {
            ...defaultFilter,
            status
          }
        : {
            ...this.params.filter,
            status,
            isFavourite: null
          };
    this.changed.emit({
      ...this.params,
      filter
    });
  }

  isStatus(status: 'all' | 'random' | 'readToday' | ItemStatus): boolean {
    return this.params.filter.status === status;
  }

  isFavourite(): boolean {
    return this.params.filter.isFavourite;
  }

  setFavourite() {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        status: 'all',
        isFavourite: true
      }
    });
  }

  isPriority(priority: null | ItemPriority): boolean {
    return priority === this.params.filter.priority;
  }

  isTag(tagId: string): boolean {
    return tagId === this.params.filter.tagId;
  }

  setPriority(priority: null | ItemPriority) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        priority
      }
    });
  }

  randomise() {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        random: Math.random()
      }
    });
  }
}
