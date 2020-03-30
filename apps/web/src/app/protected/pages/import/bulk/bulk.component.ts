import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TagService, ItemService, LoggerService } from '../../../../services';
import { ParseBookmarksResult, parseBookmarks } from './bookmarks-parser';
import { ItemPriority, ItemSkeleton, ItemRating } from '../../../interfaces';
import {
  BookmarksBookmark,
  BookmarksParserResult,
  BookmarksBaseUnionType,
  BookmarksFolder
} from './bookmarks-parser/parser.interface';
import { ToggleTagEvent } from '../../../components/shared/items-list/list.component';

export interface ImportData {
  bookmarks: BookmarksBookmark[];
  tags: string[];
  priority: ItemPriority;
}
type ImportBookmarksState = 'editing' | 'sending' | 'error' | 'success';

@Component({
  selector: 'tt-import-bulk-page',
  templateUrl: './bulk.component.pug',
  styleUrls: ['./bulk.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportBulkPageComponent {
  inputTags: string[] = [];
  priority: ItemPriority = 0;
  bookmarksImport$ = new BehaviorSubject<ParseBookmarksResult>(null);
  importState$ = new BehaviorSubject<ImportBookmarksState>('editing');

  constructor(public tagService: TagService, private itemService: ItemService, private logger: LoggerService) {}

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

  parseFile(event): void {
    const [file] = event.target.files;
    const isTxt = file && file.type === 'text/plain';
    const isHtml = file && file.type === 'text/html';
    if (!isHtml && !isTxt) {
      this.logger.error({
        messageForDev: 'Wrong file type was selected for Import Bulk',
        messageForUser: 'Please choose Bookmarks file (.html) or Text file (usually .txt)',
        params: { type: file.type }
      });
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = event => {
      try {
        this.bookmarksImport$.next(parseBookmarks(event.target['result'].toString(), isTxt && 'txt'));
      } catch (error) {
        this.logger.error({
          messageForDev: error.message,
          messageForUser: error.message,
          error
        });
      }
    };
    reader.onerror = event => {
      this.logger.error({
        messageForDev: 'Error while reading file',
        messageForUser: "File couldn't be read.",
        params: { event }
      });
    };
  }
  async save(): Promise<void> {
    const bookmarks = this.getSelectedBookmarks(this.bookmarksImport$.value.bookmarks, []),
      tags = [...this.getCommonTags(), ...this.inputTags],
      priority = this.priority;
    const items: ItemSkeleton[] = bookmarks.map(b => ({
      title: b.title,
      tags: Array.from(
        new Set<string>([...b.tags, ...tags])
      ),
      url: b.url,
      rating: 0 as ItemRating,
      priority
    }));
    this.importState$.next('sending');
    const isSuccessful = await this.itemService.bulkCreate(items);
    this.importState$.next(isSuccessful ? 'success' : 'error');
  }

  reset(): void {
    this.importState$.next('editing');
    this.bookmarksImport$.next(null);
  }

  private getCommonTags(): string[] {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[today.getMonth()];
    const day = today.getDate();
    const time = `${today.getHours()}:${(today.getMinutes() < 10 ? '0' : '') + today.getMinutes()}`;
    const date = `${day} ${month} ${time}`;
    return [`Import ${date}`];
  }
}
