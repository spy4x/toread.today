import { BaseEntity } from './baseEntity.interface';


export interface ItemsCounter extends BaseEntity {
  all: number
  favourites: number
  withComment: number
  statuses: {
    [status: string]: number
  }
  tags: {
    [tagId: string]: number
  }
  priorities: {
    [priority: string]: number
  }
  ratings: {
    [rating: string]: number
  }
  types: {
    [type: string]: number
  }
}
