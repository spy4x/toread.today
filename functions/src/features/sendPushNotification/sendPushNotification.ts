import { Notification, User } from '../../+utils/interfaces';
import { admin, config, firestore, messaging } from '../../+utils/firebase/firebase';

export const featureSendPushNotification = async (notification: Notification): Promise<void> => {
  const logPrefix = 'featureSendPushNotification():';
  try {
    if (notification.type !== 'roadmap') {
      console.log(`${logPrefix} Notification type is not "roadmap". Break.`,
        JSON.stringify(notification, null, 2));
      return;
    }
    // fetch user doc
    const userDocSnapshot = await firestore.doc(`users/${notification.userId}`).get();
    if (!userDocSnapshot.exists) {
      console.error(`${logPrefix} User doesn't exist. Break.`, JSON.stringify(notification, null, 2));
      return;
    }
    const user = { ...userDocSnapshot.data(), id: userDocSnapshot.id } as User;

    // check if he wants to get push notifications
    if (!user.sendRoadmapActivityPushNotifications) {
      console.log(`${logPrefix} User doesn't want to receive push notifications about roadmap activity. Break.`,
        JSON.stringify({
          notification,
          user
        }, null, 2));
      return;
    }

    const tokens = user.fcmTokens.map(fcmToken => fcmToken.token);
    if (!tokens.length) {
      console.log(`${logPrefix} User has no "fcmTokens" to send to. Break.`,
        JSON.stringify({ notification, user }, null, 2));
      return;
    }

    const payload: messaging.MessagingPayload = {
      notification: {
        title: 'Update in related roadmap activity',
        body: notification.text,
        icon: config.frontend.url + 'favicon.ico',
        clickAction: config.frontend.url + 'roadmap'
      }
    };

    // Send notifications to all tokens.
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log(`${logPrefix} Push notifications sent to user.`, JSON.stringify({ notification, user }, null, 2));
    // For each message check if there was an error.
    const tokensToRemove: (null | string)[] = response.results.map((result, index) => {
      const error = result.error;
      if (error) {
        console.error(`${logPrefix} Failure sending notification to`, tokens[index], error);
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
          return tokens[index];
        }
      }
      return null;
    });
    const fcmTokens = user.fcmTokens.filter(fcmToken => tokensToRemove.indexOf(fcmToken.token) === -1);
    if (fcmTokens.length !== user.fcmTokens.length) {
      const update: Partial<User> = { fcmTokens };
      await userDocSnapshot.ref.update(update);
      console.log(`${logPrefix} User updated with new fcmTokens:`, JSON.stringify({ user, fcmTokens }, null, 2));
    }
    console.log(`${logPrefix}: Success`);
  } catch (error) {
    console.error(`${logPrefix}`, error, JSON.stringify(notification, null, 2));
  }
};
