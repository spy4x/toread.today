import { BookmarksBookmark, BookmarksFolder } from './parser.interface';
import { setStateProperties } from '../state.helper';

export const createBookmarksFolder = (folder: Partial<BookmarksFolder>) : BookmarksFolder => {
  const defaults: BookmarksFolder = {
    type: 'folder',
    isSelected: true,
    isExpanded: false,
    title: '',
    children: []
  };
  return setStateProperties(defaults, folder);
};

export const createBookmarksBookmark = (folder: Partial<BookmarksBookmark>) : BookmarksBookmark => {
  const defaults: BookmarksBookmark = {
    type: 'bookmark',
    isSelected: true,
    url: '',
    title: '',
    tags: []
  };
  return setStateProperties(defaults, folder);
};
