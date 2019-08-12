import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';

export interface ToggleTagEvent {
  id: string
  isSelected: boolean
}

@Component({
  selector: 'tt-tags',
  templateUrl: './tags.component.pug',
  styleUrls: ['./tags.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent {
  @Input() all: Tag[];
  @Input() selectedIds: string[];
  @Output() toggle = new EventEmitter<ToggleTagEvent>();

  isSelected(tag: Tag): boolean {
    return this.selectedIds.includes(tag.id);
  }

  toggleTag(tag: Tag): void {
    this.toggle.emit({ id: tag.id, isSelected: !this.selectedIds.includes(tag.id) });
  }
}
