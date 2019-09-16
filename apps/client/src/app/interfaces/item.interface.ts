export type ItemStatus = 'new' | 'opened' | 'finished'
export type ItemType = null | 'website' | 'video' | 'article' | 'profile'
export type ItemURLParseStatus = 'notStarted' | 'done' | 'error'

export interface ItemSkeleton {
  url: string
  tags: string[]
  title: null | string
}

export interface Item extends ItemSkeleton{
  id?: string
  createdBy: string
  createdAt: Date
  priority: 1 | 2 | 3
  isFavourite: boolean
  type: ItemType
  status: ItemStatus
  openedAt: null | Date
  finishedAt: null | Date
  urlParseStatus: ItemURLParseStatus
  urlParseError: null | string
}
