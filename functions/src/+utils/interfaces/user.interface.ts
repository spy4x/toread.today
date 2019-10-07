import { BaseEntity } from './baseEntity.interface';

export interface User extends BaseEntity {
  displayName: null | string
  email: null | string
  photoURL: null | string
  createdAt: Date

  // settings
  sendRoadmapActivityPushNotifications: null | boolean
}
