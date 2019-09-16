import { BookmarksParser, BookmarksParserResult } from './parser.interface';
import { createBookmarksBookmark, createBookmarksFolder } from './bookmarks.helper';

class PocketBookmarksParser implements BookmarksParser {
  readonly name = 'pocket';

  canParse(html: string): boolean {
    return /<title>Pocket Export<\/title>/i.test(html);
  }

  parse(html: string): BookmarksParserResult {
    const el = document.createElement('html');
    el.innerHTML = html;
    const result: BookmarksParserResult = [];
    const lists = Array.from(el.getElementsByTagName('ul'));
    for (let list of lists) {
      let folderTitle: string,
        h1: any = list;
      while (h1.previousSibling) {
        if (h1.previousSibling.nodeType != el.TEXT_NODE) {
          break;
        }
        h1 = h1.previousSibling;
      }
      h1 = h1.previousSibling;
      if (!h1) {
        throw new Error('Folder title not found');
      }
      folderTitle = h1.textContent;
      const folder = createBookmarksFolder({
        title: folderTitle
      });
      const lis = Array.from(list.getElementsByTagName('li'));
      for (let li of lis) {
        const a = li.querySelector('a');
        if (!a) {
          continue;
        }
        const bookmark = createBookmarksBookmark({
          title: a.textContent,
          url: a.getAttribute('href'),
          tags: a.getAttribute('tags').split(',')
        });
        folder.children.push(bookmark);
      }
      result.push(folder);
    }
    return result;
  }
}

export const pocketBookmarksParser = new PocketBookmarksParser();
