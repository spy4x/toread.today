import { Notification } from '../interfaces/notification.interface';
import { firestore } from '../firebase/firebase';

export const createNotification = async (message: string, userId: string): Promise<void> => {
  console.log(`Creating notification "${message}"`);
  const notification: Notification = {
    status: 'new',
    type: 'info',
    text: message,
    userId,
    createdAt: new Date()
  };
  await firestore.collection('notifications').add(notification);
  console.log(`Notification "${message}" created.`);
};
