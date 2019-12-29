import { BaseEntity } from './baseEntity.interface';

export type ItemStatus = 'new' | 'opened' | 'finished'
export type ItemType = null | 'website' | 'video' | 'article' | 'profile'
export type ItemURLParseStatus = 'notStarted' | 'done' | 'error'
export type ItemPriority = 0 | 1 | 2 | 3
export type ItemRating = -1 | 0 | 1

export interface ItemSkeleton {
  url: string
  tags: string[]
  title: null | string
  rating: ItemRating
  priority: ItemPriority
}

export interface Item extends ItemSkeleton, BaseEntity {
  createdBy: string
  createdAt: Date
  comment: string
  withComment: boolean
  isFavourite: boolean
  type: ItemType
  status: ItemStatus
  openedAt: null | Date
  finishedAt: null | Date
  urlParseStatus: ItemURLParseStatus
  urlParseError: null | string
}
