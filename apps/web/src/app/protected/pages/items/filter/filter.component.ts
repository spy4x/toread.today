import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { ItemPriority, ItemStatus, ItemsCounter, Tag } from '../../../interfaces';
import { ToggleTagEvent } from '../../../components/shared/items-list/list.component';
import { RequestParams } from '../../../../services';

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
  statuses: ItemStatus[] = ['new', 'opened', 'finished'];

  toggleTagId(event: ToggleTagEvent) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        tagId: event.isSelected ? event.tagId : null
      }
    });
  }

  setStatus(status: null | ItemStatus) {
    this.changed.emit({
      ...this.params,
      filter: {
        ...this.params.filter,
        status,
        isFavourite: null
      }
    });
  }

  isStatus(status: null | ItemStatus): boolean {
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
        status: null,
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
}
