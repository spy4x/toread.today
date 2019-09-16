import { BookmarksParser, BookmarksParserResult } from './parser.interface';
import { pocketBookmarksParser } from './pocket.parser';
import { netscapeBookmarksParser } from './browser-html.parser';
import { txtParser } from './txt.parser';

const parsers: BookmarksParser[] = [netscapeBookmarksParser, pocketBookmarksParser, txtParser];

export interface ParseBookmarksResult {
  parser: string,
  bookmarks: BookmarksParserResult
}

export const parseBookmarks = (text: string, parser?: string): ParseBookmarksResult => {
  if (!text) {
    throw new Error('File is empty');
  }

  const p = parsers.find(p => parser ? p.name === parser : p.canParse(text));

  if (!p) {
    throw new Error('Can\'t parse this file. Please provide Browser bookmarks file / Pocket export file / Text plain file');
  }

  return {
    parser: p.name,
    bookmarks: p.parse(text)
  };
};
