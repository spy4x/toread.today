import { ItemPriority, ItemStatus } from '../../../interfaces/item.interface';

export interface Filter {
  tagId: null | string;
  status: null | ItemStatus;
  isFavourite: null | boolean;
  priority: null | ItemPriority;
}

export const defaultFilter: Filter = {
  tagId: null,
  status: 'new',
  isFavourite: null,
  priority: null
};
