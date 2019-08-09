import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Filter } from './filter.interface';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../tags/tags.component';

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

  toggleTagId(event: ToggleTagEvent){
    if(event.mode === 'add') {
      this.changed.emit({...this.filter, tagId: event.id});
    }else{
      this.changed.emit({...this.filter, tagId: null});
    }
  }
}
