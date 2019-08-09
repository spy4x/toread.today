import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Filter } from './filter.interface';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../tags/tags.component';
import { ItemStatus } from '../item.interface';

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
    this.changed.emit({ ...this.filter, tagId: event.mode === 'add' ? event.id : null });
  }

  setStatus(status: ItemStatus) {
    this.changed.emit({ ...this.filter, status: status });
  }

  isStatus(status: ItemStatus): boolean {
    return this.filter.status === status;
  }
}
