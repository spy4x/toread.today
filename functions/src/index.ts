import { onFileUploadFunction } from './triggers/st';
import { httpsFunction } from './triggers/https';
import {
  admin,
  auth,
  BatchSwarm,
  config,
  FieldValue,
  firestore,
  functions,
  messaging,
  runTransaction
} from './+utils/firebase';
import { createNotification } from './+utils/common';
import { Notification, RoadmapBrick, Tag, User } from './+utils/interfaces';
import { itemOnWriteTrigger } from './triggers/fs';

const antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';

console.log('--- COLD START ---');

export const itemOnWrite = itemOnWriteTrigger;


const getTagRemovedData = (tagId: string): any => {
  return {
    tags: admin.firestore.FieldValue.arrayRemove(tagId)
  };
};

const mergeTags = async (tagIdFrom: string, tagIdTo: string): Promise<void> => {
  console.log(`mergeTags(): Start`, { tagIdFrom, tagIdTo });
  try {
    const fetchLimit = 250;
    const items = await firestore
      .collection(`items`)
      .where('tags', 'array-contains', tagIdFrom)
      .limit(fetchLimit)
      .get();
    const itemsFetched = items.docs.length;
    console.log(`mergeTags(): Fetched ${itemsFetched} items for tag "${tagIdFrom}".`);
    const batch = new BatchSwarm();
    items.docs.forEach(itemDoc => {
      const itemRef = firestore.doc('items/' + itemDoc.id);
      batch.update(itemRef, { tags: FieldValue.arrayUnion(tagIdTo) });
      batch.update(itemRef, { tags: FieldValue.arrayRemove(tagIdFrom) });
    });
    await batch.commit();
    console.log(`mergeTags(): Updated ${itemsFetched} items.`);

    if (itemsFetched === fetchLimit) {
      console.log('mergeTags(): Batch Success. Fetching next batch...');
      await mergeTags(tagIdFrom, tagIdTo);
    } else {
      await firestore.doc(`tags/${tagIdFrom}`).delete();
      console.log(`mergeTags(): Tag "${tagIdFrom}" was deleted.`);
      console.log('mergeTags(): Success.');
    }
  } catch (error) {
    console.error('mergeTags()', error);
  }
};

export const onTagUpdate = functions.firestore
  .document(`tags/{id}`)
  .onUpdate(async change => {
    const before = { ...change.before.data(), id: change.before.id } as Tag;
    const after = { ...change.after.data(), id: change.after.id } as Tag;
    if (before.mergeIntoTagId === null && after.mergeIntoTagId !== null) {
      const tagTo = await firestore.doc(`tags/${after.mergeIntoTagId}`).get();
      if (!tagTo.exists || after.createdBy !== tagTo.data().createdBy) {
        return;
      }
      await mergeTags(after.id, after.mergeIntoTagId);
    }
  });


export const onTagDelete = functions.firestore
  .document(`tags/{id}`)
  .onDelete(async doc => {
    const tag = { id: doc.id, ...doc.data() };
    console.log('onTagDelete - Working on tag:', tag);
    try {
      const items = await firestore
        .collection('items')
        .where('tags', 'array-contains', tag.id)
        .get();
      console.log('onTagDelete - Found items:', items.docs.length);

      const batch = new BatchSwarm();
      items.docs.forEach(itemDoc => {
        const itemRef = firestore.doc('items/' + itemDoc.id);
        const data = getTagRemovedData(tag.id);
        batch.update(itemRef, data);
      });
      await batch.commit();

      console.log('onTagDelete - Success');
    } catch (error) {
      console.error('onTagDelete', tag, error);
    }
  });


export const onRoadmapBrickCreate = functions.firestore
  .document(`roadmapBricks/{id}`)
  .onCreate(async doc => {
    const brick = { ...doc.data(), id: doc.id } as RoadmapBrick;
    const promises = [];
    if (brick.createdBy !== antonId) {
      promises.push(createNotification({
        text: `New ${brick.type} has been created: Id:${brick.id} "${brick.title}" by userId:${brick.createdBy}.`,
        userId: antonId, type: 'roadmap'
      }));
    }
    promises.push(createNotification({
      text:
        `Your ${brick.type} has been registered! Thank you for your commitment. 🤟`,
      userId: brick.createdBy, type: 'roadmap'
    }));
    await Promise.all(promises);
  });

export const onRoadmapBrickUpdate = functions.firestore
  .document(`roadmapBricks/{id}`)
  .onUpdate(async change => {
    const before = { ...change.before.data(), id: change.before.id } as RoadmapBrick;
    const after = { ...change.after.data(), id: change.after.id } as RoadmapBrick;

    const promises = [];
    // Like START
    const newLikeId = after.likedBy.find(userId => before.likedBy.indexOf(userId) === -1);
    if (newLikeId && after.createdBy !== newLikeId) {
      promises.push(
        createNotification({
          text: `Yahoo! Somebody liked your ${after.type} "${after.title}". 👍`,
          userId: after.createdBy,
          type: 'roadmap'
        }));
    }
    // Like END

    // Approved START
    if (before.type === 'suggestion' && after.type === 'feature') {
      promises.push(createNotification(
        {
          text: `Your ${after.type} "${after.title}" was approved and is going to be implemented. 👍 Thanks for your help!`,
          userId: after.createdBy, type: 'roadmap'
        }));
    }
    // Approved END

    // inProgress START
    if (before.status === 'new' && after.status === 'inProgress') {
      promises.push(createNotification(
        {
          text: `Your ${after.type} "${after.title}" is in work. We'll update you once it's implemented. 😊`,
          userId: after.createdBy, type: 'roadmap'
        }));
    }
    // Done END

    // Done START
    if (before.status !== 'done' && after.status === 'done') {
      const version = `${after.releasedInVersion ? `v${after.releasedInVersion}` : 'new version'}`;
      promises.push(createNotification(
        {
          text: `Your roadmap ${after.type} "${after.title}" is implemented. Check it out in ${version}! 😉`,
          userId: after.createdBy, type: 'roadmap'
        }));
      const text = `Roadmap ${after.type} that you were interested in, "${after.title}" has been implemented. Check it out in ${version}! 😉`;
      after.likedBy.forEach(userIdWhoLiked => {
        if (userIdWhoLiked === after.createdBy) {
          return;
        }
        promises.push(createNotification({ text, userId: userIdWhoLiked, type: 'roadmap' }));
      });
    }
    // Done END
    await Promise.all(promises);
  });

export const onUserSignUp = functions.auth
  .user()
  .onCreate(async (userRecord) => {
    const promise1 = createNotification({
      text: `User "${userRecord.displayName}" with email "${userRecord.email}" has signed up`,
      userId: antonId,
      type: 'info'
    });
    const promise2 = createUserInDB(userRecord);
    return Promise.all([promise1, promise2]);
  });

async function createUserInDB(user: auth.UserRecord): Promise<void> {
  try {
    await runTransaction(async transaction => {
      const dbUser: User = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        sendRoadmapActivityPushNotifications: null,
        fcmTokens: []
      };
      return transaction.create(firestore.doc(`users/${user.uid}`), dbUser);
    }, { logPrefix: 'createUserInDB' });
    console.log('createUserInDB(): Success.', { user });
  } catch (error) {
    console.error('createUserInDB(): Failed to create a user in DB.', error, { user });
  }
}


export const onNotificationCreate = functions.firestore
  .document(`notifications/{id}`)
  .onCreate(async doc => {
    const notification = { ...doc.data(), id: doc.id } as Notification;
    await sendPushNotification(notification);
  });

async function sendPushNotification(notification: Notification): Promise<void> {
  try {
    if (notification.type !== 'roadmap') {
      console.log('sendPushNotification(): Notification type is not "roadmap". Break.',
        JSON.stringify(notification, null, 2));
      return;
    }
    // fetch user doc
    const userDocSnapshot = await firestore.doc(`users/${notification.userId}`).get();
    if (!userDocSnapshot.exists) {
      console.error('sendPushNotification(): User doesn\'t exist. Break.', JSON.stringify(notification, null, 2));
      return;
    }
    const user = { ...userDocSnapshot.data(), id: userDocSnapshot.id } as User;

    // check if he wants to get push notifications
    if (!user.sendRoadmapActivityPushNotifications) {
      console.log(
        `sendPushNotification(): User doesn't want to receive push notifications about roadmap activity. Break.`,
        JSON.stringify({
          notification,
          user
        }, null, 2));
      return;
    }
    const tokens = user.fcmTokens.map(fcmToken => fcmToken.token);
    if (!tokens.length) {
      console.log('sendPushNotification(): User has no "fcmTokens" to send to. Break.',
        JSON.stringify({ notification, user }, null, 2));
      return;
    }

    // use admin.messaging() to send pushes
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
    console.log(`Push notifications sent to user.`, JSON.stringify({ notification, user }, null, 2));
    // For each message check if there was an error.
    const tokensToRemove: (null | string)[] = response.results.map((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
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
      console.log('User updated with new fcmTokens:', JSON.stringify({ user, fcmTokens }, null, 2));
    }
  } catch (error) {
    console.error('sendPushNotification() failed.', error, JSON.stringify(notification, null, 2));
  }
}

export const https = httpsFunction;
export const onFileUpload = onFileUploadFunction;
