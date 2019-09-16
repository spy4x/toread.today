import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import {
  BookmarksBaseUnionType,
  BookmarksBookmark,
  BookmarksFolder,
  BookmarksParserResult
} from '../bookmarks-parser/parser.interface';
import { ParseBookmarksResult } from '../bookmarks-parser';
import { Tag } from '../interfaces/tag.interface';
import { ToggleTagEvent } from '../list/list.component';

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
  @Output() done = new EventEmitter<{bookmarks: BookmarksBookmark[], tags: string[]}>();
  @Output() cancel = new EventEmitter<void>();
  inputTags: string[] = [];

  save(): void {
    this.done.emit({ bookmarks: this.getSelectedBookmarks(this.import.bookmarks, []), tags: [...this.getCommonTags(), ...this.inputTags]});
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
      this.inputTags = [...this.inputTags, event.id];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.id);
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
