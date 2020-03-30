import { User } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import * as admin from 'firebase-admin';
import { runTransaction } from '../../+utils/firebase/runTransaction';
import UserRecord = admin.auth.UserRecord;
import { createNotification } from '../../+utils/common';

export const featureCreateUserInDB = async (user: UserRecord): Promise<void> => {
  const logPrefix = 'featureCreateUserInDB():';
  try {
    const antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';
    const promise1 = createNotification({
      text: `User "${user.displayName}" with email "${user.email}" has signed up`,
      userId: antonId,
      type: 'roadmap'
    });
    const promise2 = runTransaction(async transaction => {
      const dbUser: User = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        sendRoadmapActivityPushNotifications: null,
        fcmTokens: []
      };
      return transaction.create(firestore.doc(`users/${user.uid}`), dbUser);
    }, { logPrefix });
    await Promise.all([promise1, promise2]);
    console.log(`${logPrefix} Success.`);
  } catch (error) {
    console.error(`${logPrefix}`, error);
  }
};
