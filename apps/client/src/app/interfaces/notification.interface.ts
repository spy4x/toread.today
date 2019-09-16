export type NotificationStatus = 'new' | 'read'
export type NotificationType = 'info'

export interface Notification {
  id?: string
  status: NotificationStatus
  type: NotificationType
  text: string
  userId: string
  createdAt: Date
}