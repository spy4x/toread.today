import { BaseEntity } from './baseEntity.interface';

export interface FCMToken {
  token: string
  createdAt: Date
}

export interface User extends BaseEntity {
  displayName: null | string
  email: null | string
  photoURL: null | string
  createdAt: Date

  // settings
  sendRoadmapActivityPushNotifications: null | boolean
  fcmTokens: FCMToken[]
}
