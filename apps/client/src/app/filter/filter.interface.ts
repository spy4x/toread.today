import { ItemStatus } from '../item.interface';

export interface Filter {
  tagId: null | string
  status: null | ItemStatus
  isFavourite: null | boolean
}
