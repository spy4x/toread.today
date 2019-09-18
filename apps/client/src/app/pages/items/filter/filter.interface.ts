import { ItemStatus } from '../../../interfaces/item.interface';

export interface Filter {
  tagId: null | string
  status: null | ItemStatus
  isFavourite: null | boolean
}
