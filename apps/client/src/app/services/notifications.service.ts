import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Notification } from '../interfaces';
import { LoggerService } from './logger.service';


@Injectable()
export class NotificationsService {
  constructor(private firestore: AngularFirestore,
              private logger: LoggerService) {
  }

  async create(notification: Partial<Notification>): Promise<void> {
    const n: Notification = {
      status: 'new',
      type: notification.type || 'info',
      text: notification.text,
      userId: notification.userId,
      createdAt: new Date()
    };
    try {
      await this.firestore.collection('notifications').add(n);
    } catch (error) {
      this.logger.error({
        messageForDev: `NotificationsService.create(): failed.`,
        messageForUser: `Failed to create a notification`,
        error,
        params: { notification, n }
      });
    }
  }

}
