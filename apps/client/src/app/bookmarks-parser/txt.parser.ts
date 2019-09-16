import { BookmarksParser, BookmarksParserResult } from './parser.interface';
import { createBookmarksBookmark } from './bookmarks.helper';

class TxtParser implements BookmarksParser {
  readonly name = 'txt';

  canParse(text: string): boolean {
    return true;
  }

  parse(text: string): BookmarksParserResult {
    const separator = /[\r\n\t\f\v ]+/; // any spaces, tabs, \n
    const urls = text.split(separator);
    return urls.reduce((acc, url) => {
      const value = url.trim();
      if (!value) {
        return acc;
      }
      return [...acc, createBookmarksBookmark({ url: value, title: null })];
    }, []);
  }
}

export const txtParser = new TxtParser();
