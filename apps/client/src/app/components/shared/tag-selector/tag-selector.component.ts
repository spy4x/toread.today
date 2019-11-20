import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../../interfaces/tag.interface';
import { ToggleTagEvent } from '../items-list/list.component';

@Component({
  selector: 'tt-tag-selector',
  templateUrl: './tag-selector.component.pug',
  styleUrls: ['./tag-selector.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagSelectorComponent {
  @Input() tags: Tag[] = [];
  @Input() selectedIds: string[] = [];
  @Input() helpText = '';
  @Input() isDropdownTriggerCustom = false;
  @Input() asButton = false;
  @Input() isAllTagsVisible = false;
  @Input() isDropdownLeft = false;
  @Input() hideSelected = false;
  @Output() toggle = new EventEmitter<ToggleTagEvent>();
  @Output() tagClick = new EventEmitter<string>();
  searchText = '';

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  toggleTag(id: string): void {
    this.toggle.emit({ tagId: id, isSelected: !this.isSelected(id) });
  }

  deselectAll(): void {
    this.selectedIds.forEach(tagId => this.toggle.emit({ tagId, isSelected: false }));
  }

  tagClickHandler(id: string, event: MouseEvent) {
    if (!this.isAllTagsVisible) {
      event.stopPropagation();
    }
    this.tagClick.emit(id);
  }
}
