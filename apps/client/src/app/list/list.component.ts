import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Item } from '../item.interface';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../tags/tags.component';

export interface ToggleItemTagEvent extends ToggleTagEvent {
  itemId: string
}

@Component({
  selector: 'tt-list',
  templateUrl: './list.component.pug',
  styleUrls: ['./list.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  @Input() items: Item[];
  @Input() tags: Tag[];
  @Output() startReading = new EventEmitter<string>();
  @Output() finishReading = new EventEmitter<string>();
  @Output() undoReading = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() toggleTag = new EventEmitter<ToggleItemTagEvent>();

  toggleTagHandler(event: ToggleTagEvent, item: Item) {
    this.toggleTag.emit({...event, itemId: item.id})
  }
}
