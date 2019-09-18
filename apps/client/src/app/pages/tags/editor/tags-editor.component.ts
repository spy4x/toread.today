import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../../interfaces/tag.interface';

export interface TagUpdateEvent {
  id: string
  change: Partial<Tag>
}

@Component({
  selector: 'tt-tags-editor',
  templateUrl: './tags-editor.component.pug',
  styleUrls: ['./tags-editor.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsEditorComponent {
  @Input() tags: Tag[];
  @Output() create = new EventEmitter<Tag>();
  @Output() update = new EventEmitter<TagUpdateEvent>();
  @Output() delete = new EventEmitter<string>();
  tagIdsInEditMode: string[] = [];
  colors = [
    '#209cee',
    '#F3B5FF',
    '#6f5499',
    '#23d160',
    '#ffdd57',
    '#ff0090',
    '#ff652f',
    '#ff0000',
    '#363636',
  ];
  newTagColor: string = this.colors[0];
  newTagTitle: string = '';

  setTitle(tag: Tag, title: string): void {
    this.update.emit({ id: tag.id, change: { title } });
    this.toggleEditMode(tag);
  }

  setColor(tag: Tag, color: string): void {
    this.update.emit({ id: tag.id, change: { color } });
  }

  isColor(tag: Tag, color: string): boolean {
    return tag.color === color;
  }

  createHandler(title: string, color: string): void {
    if(!title){
      return;
    }
    const newTag: Tag = {
      title: title,
      color: color,
      createdAt: new Date(),
      createdBy: null
    };
    this.create.emit(newTag);
  }

  toggleEditMode(tag: Tag): void {
    if(!this.tagIdsInEditMode.includes(tag.id)){
      this.tagIdsInEditMode = [...this.tagIdsInEditMode, tag.id];
    }else{
      this.tagIdsInEditMode = this.tagIdsInEditMode.filter(id => id !== tag.id);
    }
  }

  isInEditMode(tagId: string): boolean {
    return this.tagIdsInEditMode.includes(tagId);
  }

  deleteHandler(tag: Tag): void{
    if (!confirm('Are you sure you want to completely delete this tag?')) {
      return;
    }
    this.delete.emit(tag.id);
  }
}
