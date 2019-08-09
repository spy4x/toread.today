import { ItemStatus } from '../item.interface';

export interface Filter {
  tagId: string
  status: ItemStatus
}
