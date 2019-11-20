import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import {
  BookmarksBaseUnionType,
  BookmarksBookmark,
  BookmarksFolder,
  BookmarksParserResult
} from '../../../helpers/bookmarks-parser/parser.interface';
import { ParseBookmarksResult } from '../../../helpers/bookmarks-parser/index';
import { Tag } from '../../../interfaces/tag.interface';
import { ToggleTagEvent } from '../../../components/shared/items-list/list.component';
import { ItemPriority } from '../../../interfaces/item.interface';

export interface ImportData {
  bookmarks: BookmarksBookmark[],
  tags: string[],
  priority: ItemPriority
}

@Component({
  selector: 'tt-items-import',
  templateUrl: './items-import.component.pug',
  styleUrls: ['./items-import.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsImportComponent {
  @Input() import: ParseBookmarksResult;
  @Input() tags: Tag[] = [];
  @Output() done = new EventEmitter<ImportData>();
  @Output() cancel = new EventEmitter<void>();
  inputTags: string[] = [];
  priority: ItemPriority = 0;

  save(): void {
    this.done.emit({
      bookmarks: this.getSelectedBookmarks(this.import.bookmarks, []),
      tags: [...this.getCommonTags(), ...this.inputTags],
      priority: this.priority
    });
  }

  private getSelectedBookmarks(items: BookmarksParserResult, tags: string[]): BookmarksBookmark[] {
    const accumulator: BookmarksBookmark[] = [];
    const iterator = (acc: BookmarksBookmark[], cur: BookmarksBaseUnionType) => {
      if (cur.type === 'bookmark') {
        cur.tags = [...cur.tags, ...tags];
        return cur.isSelected ? [...acc, cur] : acc;
      }
      const folder = cur as BookmarksFolder;
      const filteredItems = this.getSelectedBookmarks(folder.children, [...tags, folder.title]);
      return [...acc, ...filteredItems];
    };
    return items.reduce(iterator, accumulator);
  }

  toggleTag(event: ToggleTagEvent) {
    if (event.isSelected) {
      this.inputTags = [...this.inputTags, event.tagId];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.tagId);
    }
  }

  private getCommonTags(): string[] {
    const today = new Date();
    const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[today.getMonth()];
    const day = today.getDate();
    const time = `${today.getHours()}:${(today.getMinutes()<10?'0':'') + today.getMinutes()}`;
    const date = `${day} ${month} ${time}`;
    return [`Import ${date}`];
  }
}
