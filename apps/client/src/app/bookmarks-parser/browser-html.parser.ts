import { BookmarksBookmark, BookmarksFolder, BookmarksParser, BookmarksParserResult } from './parser.interface';
import { createBookmarksBookmark, createBookmarksFolder } from './bookmarks.helper';

class NetscapeBookmarksParser implements BookmarksParser {
  readonly name = 'browser-html';
  foldersToSkip = ['Bookmarks Bar'];

  canParse(html: string): boolean {
    for (let i = 0, length = html.length; i < length; i++) {
      // skip any whitespace characters
      if (/\s/.test(html[i])) {
        continue;
      }
      // first symbol must be <
      if (html[i] === '<') {
        break;
      }
      else {
        return false;
      }
    }
    return /<dl/i.test(html) &&
      /<\/dl/i.test(html) &&
      /<dt/i.test(html) &&
      /<a[^<>]href\s*=\s*/i.test(html);
  };


  parse(html: string): BookmarksParserResult {
    const el = document.createElement('html');
    el.innerHTML = html;
    const result: BookmarksParserResult = [];
    const dts = Array.from(el.querySelectorAll('body > dt')) as HTMLElement[]; // For Safari
    dts.forEach(dt => result.push(...this.parseDT(dt)));
    const dls = Array.from(el.querySelectorAll('body > dl')) as HTMLElement[]; // For Chrome
    dls.forEach(dl => result.push(...this.parseDL(dl)));
    return result;
  }

  getBookmark(parentElement: HTMLElement): null | BookmarksBookmark {
    const a = parentElement.querySelector('a');
    if (!a) {
      return null;
    }
    return createBookmarksBookmark({
      title: a.textContent,
      url: a.getAttribute('href'),
    });
  }

  parseDT(dt: HTMLElement): (BookmarksBookmark | BookmarksFolder)[] {
    const folderTitleElement = Array.from(dt.children).find(ch => ch.matches('h3')) as HTMLElement;
    if (!folderTitleElement) { // it's one bookmark
      const bookmark = this.getBookmark(dt);
      return bookmark ? [bookmark] : [];
    }
    // it's a folder
    const folderTitle = folderTitleElement.textContent;

    const dls = Array.from(dt.children).filter(ch => ch.matches('dl')) as HTMLElement[];
    const elements = dls.map(dl => this.parseDL(dl)).reduce((cur, acc) => [...cur, ...acc], []);


    if (this.foldersToSkip.includes(folderTitle)) {
      return elements;
    } else {
      const folder = createBookmarksFolder({
        title: folderTitle,
        children: elements,
      });

      return folder.children.length ? [folder] : [];
    }
  }

  parseDL(dl: HTMLElement): (BookmarksBookmark | BookmarksFolder)[] {
    const dts = Array.from(dl.children).filter(ch => ch.matches('dt')) as HTMLElement[];
    return dts.map(dt => this.parseDT(dt)).reduce((cur, acc) => [...cur, ...acc], []);
  }
}

export const netscapeBookmarksParser = new NetscapeBookmarksParser();
