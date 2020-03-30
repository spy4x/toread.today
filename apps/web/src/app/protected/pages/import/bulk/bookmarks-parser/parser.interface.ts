export interface BookmarksBaseType {
  title: string;
  isSelected: boolean;
  type: 'bookmark' | 'folder';
}
export interface BookmarksBookmark extends BookmarksBaseType {
  url: string;
  type: 'bookmark';
  tags: string[];
}

export type BookmarksBaseUnionType = BookmarksBookmark | BookmarksFolder;

export interface BookmarksFolder extends BookmarksBaseType {
  type: 'folder';
  isExpanded: boolean;
  children: BookmarksBaseUnionType[];
}

export type BookmarksParserResult = BookmarksBaseUnionType[];

export interface BookmarksParser {
  name: string;

  canParse(html: string): boolean;

  parse(html: string): BookmarksParserResult;
}
