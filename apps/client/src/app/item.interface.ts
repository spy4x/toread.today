export type ItemStatus = 'new' | 'opened' | 'finished'

export interface Item {
  id: null | string
  url: string
  title: null | string
  imageUrl: null | string
  description: null | string
  createdBy: string
  createdAt: Date
  tags: string[]
  priority: 1 | 2 | 3
  isFavourite: boolean
  type: null | 'website' | 'video' | 'article' | 'profile'
  status: ItemStatus
  openedAt: null | Date
  finishedAt: null | Date
}
