import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';
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
  @Input() title: string = 'All Tags';
  @Input() searchText: string = '';
  @Input() isTitleStatic: boolean = false;
  @Input() isTitleCustom: boolean = false;
  @Input() isAllTagsVisible: boolean = true;
  @Input() isDropdownRight: boolean = true;
  @Output() toggle = new EventEmitter<ToggleTagEvent>();

  isSelected(tag: Tag): boolean {
    return this.selectedIds.includes(tag.id);
  }

  getSelected(): Tag[] {
    return this.tags ? this.tags.filter(t => this.isSelected(t)) : [];
  }

  toggleTag(tag: Tag): void {
    this.toggle.emit({ tagId: tag.id, isSelected: !this.selectedIds.includes(tag.id) });
  }

  deselectAll(): void {
    this.getSelected().forEach(tag => this.toggle.emit({tagId: tag.id, isSelected: false}))
  }

  getActiveTitle(): string {
    return this.isTitleStatic ? this.title : (this.getSelected().map(t=> t.title).join(',') || this.title)
  }
}
