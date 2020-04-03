import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { ItemPriority, ItemStatus, ItemsCounter, Tag } from '../../../interfaces';
import { ToggleTagEvent } from '../../../components/shared/items-list/list.component';
import { RequestParams } from '../../../../services';
import { defaultFilter, Filter } from './filter.interface';

@Component({
  selector: 'tt-items-filter',
  templateUrl: './filter.component.pug',
  styleUrls: ['./filter.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsFilterComponent {
  @Input() tags: Tag[];
  @Input() counter: ItemsCounter;
  @Input() params: RequestParams;
  @Output() changed = new EventEmitter<RequestParams>();

  toggleTagId(event: ToggleTagEvent) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        tagId: event.isSelected ? event.tagId : null
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
