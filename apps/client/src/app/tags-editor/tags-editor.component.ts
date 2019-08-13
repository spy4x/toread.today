import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';

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

  setTitle(tag: Tag, title: string): void {
    this.update.emit({ id: tag.id, change: { title } });
  }

  createHandler(): void {
    const newTag: Tag = {
      id: null,
      title: 'New tag',
      createdAt: new Date(),
      createdBy: null
    };
    this.create.emit(newTag);
  }

  deleteHandler(tag: Tag): void{
    if (!confirm('Are you sure you want to completely delete this tag?')) {
      return;
    }
    this.delete.emit(tag.id);
  }
}
