import { BaseEntity } from './baseEntity.interface';

export interface DuplicatedItemsInfo extends BaseEntity {
  url: string
  itemsIds: string[]
  userId: string
  createdAt: Date
}

