import { BaseEntity } from './baseEntity.interface';

export type NotificationStatus = 'new' | 'read';
export type NotificationType = 'info' | 'roadmap' | 'admin';

export interface Notification extends BaseEntity {
  status: NotificationStatus;
  type: NotificationType;
  text: string;
  userId: string;
  createdAt: Date;
}
