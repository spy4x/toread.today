import { Notification } from '../interfaces';
import { firestore } from '../firebase/firebase';

export const createNotification = async (notification: Partial<Notification>): Promise<void> => {
  const n: Notification = {
    status: 'new',
    type: notification.type || 'info',
    text: notification.text,
    userId: notification.userId,
    createdAt: new Date()
  };
  try {
    await firestore.collection('notifications').add(n);
    console.log(`Notification type:"${n.type}", "${n.text}" for user "${n.userId}" has been created.`);
  } catch (error) {
    console.error(`Creating notification failed:`, error, { notification, n });
  }
};
