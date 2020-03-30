import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { RouterHelperService, TagService } from '../../../../services';
import { ItemsCounter, Tag, TagCommandToDeleteOption } from '../../../interfaces';

export interface TagUpdateEvent {
  id: string;
  change: Partial<Tag>;
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
  @Input() counter: null | ItemsCounter = null;
  @Output() create = new EventEmitter<Tag>();
  @Output() update = new EventEmitter<TagUpdateEvent>();
  tagIdsInEditMode: string[] = [];
  colors = ['#209cee', '#F3B5FF', '#6f5499', '#23d160', '#ffdd57', '#ff0090', '#ff652f', '#ff0000', '#363636'];
  newTagColor: string = this.colors[0];
  newTagTitle: string = '';

  constructor(public routerHelper: RouterHelperService, private tagService: TagService) {}

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
    if (!title) {
      return;
    }
    const newTag: Tag = {
      title: title,
      color: color,
      mergeIntoTagId: null,
      commandToDelete: null,
      createdAt: new Date(),
      createdBy: null
    };
    this.create.emit(newTag);
    this.newTagTitle = '';
  }

  toggleEditMode(tag: Tag): void {
    if (!this.tagIdsInEditMode.includes(tag.id)) {
      this.tagIdsInEditMode = [...this.tagIdsInEditMode, tag.id];
    } else {
      this.tagIdsInEditMode = this.tagIdsInEditMode.filter(id => id !== tag.id);
    }
  }

  isInEditMode(tagId: string): boolean {
    return this.tagIdsInEditMode.includes(tagId);
  }

  async deleteHandler(tag: Tag, option: TagCommandToDeleteOption): Promise<void> {
    const linksAmount = this.counter ? this.counter[`tags.${tag.id}`] : -1;
    const additionalMessage = option === 'withItems' ? ` and ${linksAmount} related link(s)` : '';
    const message = `Are you sure you want to completely delete "${tag.title}"${additionalMessage}? This cannot be undone.`;
    if (!confirm(message)) {
      return;
    }
    this.update.emit({ id: tag.id, change: { commandToDelete: option } });
  }

  async merge(tagFrom: Tag, tagIdTo: string): Promise<void> {
    const tagTo = this.tags.find(t => t.id === tagIdTo);
    if (!tagTo || tagFrom.id === tagIdTo) {
      return;
    }
    const message = `Are you sure you want to merge all links from tag "${tagFrom.title}" to tag "${tagTo.title}"? Tag "${tagFrom.title}" will be deleted after merge.`;
    if (confirm(message)) {
      await this.tagService.merge(tagFrom, tagTo);
    }
  }
}
