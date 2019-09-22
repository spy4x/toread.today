import { ItemStatus } from '../../../interfaces/item.interface';

export interface Filter {
  tagId: null | string
  status: null | ItemStatus
  isFavourite: null | boolean
}

export const defaultFilter: Filter = {
  tagId: null,
  status: 'opened',
  isFavourite: null,
}
