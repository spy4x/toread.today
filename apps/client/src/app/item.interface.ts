export type ItemStatus = 'new' | 'opened' | 'finished'
export type ItemType = null | 'website' | 'video' | 'article' | 'profile'
export type ItemURLParseStatus = 'notStarted' | 'done' | 'error'

export interface Item {
  id: null | string
  url: string
  title: null | string
  createdBy: string
  createdAt: Date
  tags: string[]
  priority: 1 | 2 | 3
  isFavourite: boolean
  type: ItemType
  status: ItemStatus
  openedAt: null | Date
  finishedAt: null | Date
  urlParseStatus: ItemURLParseStatus
  urlParseError: null | string
}
