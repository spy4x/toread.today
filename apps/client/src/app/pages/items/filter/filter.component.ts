import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Filter } from './filter.interface';
import { Tag } from '../../../interfaces/tag.interface';
import { ItemStatus } from '../../../interfaces/item.interface';
import { ToggleTagEvent } from '../../../common-components/items-list/list.component';

@Component({
  selector: 'tt-filter',
  templateUrl: './filter.component.pug',
  styleUrls: ['./filter.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterComponent {
  @Input() tags: Tag[];
  @Input() filter: Filter;
  @Output() changed = new EventEmitter<Filter>();
  statuses: ItemStatus[] = ['opened', 'new', 'finished'];

  toggleTagId(event: ToggleTagEvent) {
    this.changed.emit({ ...this.filter, tagId: event.isSelected ? event.tagId : null });
  }

  setStatus(status: null | ItemStatus) {
    this.changed.emit({ ...this.filter, status, isFavourite: null });
  }

  isStatus(status: null | ItemStatus): boolean {
    return this.filter.status === status;
  }

  isFavourite(): boolean {
    return this.filter.isFavourite;
  }

  setFavourite() {
    this.changed.emit({ ...this.filter, status: null, isFavourite: true });
  }
}
