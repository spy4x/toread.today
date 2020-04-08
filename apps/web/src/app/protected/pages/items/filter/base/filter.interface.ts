import { ItemPriority, ItemStatus } from '../../../../interfaces/item.interface';

export interface Filter {
  tagId: null | string;
  status: 'all' | 'random' | 'readToday' | ItemStatus;
  isFavourite: null | boolean;
  priority: null | ItemPriority;
}

export const defaultFilter: Filter = {
  tagId: null,
  status: 'readToday',
  isFavourite: null,
  priority: null
};
