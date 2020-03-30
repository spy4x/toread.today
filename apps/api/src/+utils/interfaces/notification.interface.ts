export type NotificationStatus = 'new' | 'read'
export type NotificationType = 'info' | 'roadmap' | 'admin'

export interface Notification {
  id?: string
  status: NotificationStatus
  type: NotificationType
  text: string
  userId: string
  createdAt: Date
}
