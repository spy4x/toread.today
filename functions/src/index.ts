import { onFileUploadFunction } from './st';
import * as ogs from 'open-graph-scraper';
import { httpsFunction } from './https';
import { Item, ItemType } from './+utils/interfaces/item.interface';
import { admin, firestore, functions } from './+utils/firebase/firebase';
import { isUrl } from './+utils/common/isURL';
import { RoadmapBrick } from './+utils/interfaces/roadmapBrick.interface';
import { createNotification } from './+utils/common/createNotification';
import { BatchSwarm } from './+utils/firebase/batchSwarm';
import { runTransaction } from './+utils/firebase/runTransaction';
import { User } from './+utils/interfaces/user.interface';
import {auth} from 'firebase-admin';
const antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';

console.log('--- COLD START ---');


export const itemCreate = functions.firestore
  .document(`items/{id}`)
  .onCreate(async doc => {
    const item = { ...doc.data(), id: doc.id } as Item;
    if (isUrl(item.url)) {
      await parseURL(item);
    } else {
      const updateFields: Partial<Item> = {
        urlParseStatus: 'error',
        urlParseError: 'Provided URL is not valid'
      };
      try {
        console.log('itemCreate - Saving failed status:', updateFields);
        await doc.ref.update(updateFields);
        console.log('itemCreate - Successfully saved failed status');
      } catch (saveError) {
        console.error('itemCreate - Failed to save failed status', saveError);
      }
    }
  });

export const itemUpdate = functions.firestore
  .document(`items/{id}`)
  .onUpdate(async change => {
    const before = { ...change.before.data(), id: change.before.id } as Item;
    const after = { ...change.after.data(), id: change.after.id } as Item;
    if (after.urlParseStatus === 'notStarted' && before.urlParseStatus !== 'notStarted') {
      if (isUrl(after.url)) {
        await parseURL(after);
      } else {
        const updateFields: Partial<Item> = {
          urlParseStatus: 'error',
          urlParseError: 'Provided URL is not valid'
        };
        try {
          console.log('itemUpdate - Saving failed status:', updateFields);
          await change.after.ref.update(updateFields);
          console.log('itemUpdate - Successfully saved failed status');
        } catch (saveError) {
          console.error('itemUpdate - Failed to save failed status', saveError);
        }
      }
    }
  });

async function parseURL(item: Item): Promise<void> {
  console.log('parseURL - Working on:', item.id, item.url);
  const doc = firestore.doc('items/' + item.id);
  try {
    const { data } = await ogs({ url: item.url });
    const updateFields: Partial<Item> = {
      title: item.title || data.ogTitle as string || null,
      type: getType(data.ogType),
      urlParseStatus: 'done',
      urlParseError: null
    };
    console.log('parseURL - OG data:', {
      updateFields,
      data: JSON.stringify(data, null, 2)
    });
    await doc.update(updateFields);
    console.log('parseURL - Success');
  } catch (error) {
    console.error('parseURL', error);
    const updateFields: Partial<Item> = {
      urlParseStatus: 'error',
      urlParseError: error['error'] || error.message || error.name || error['errorDetails']
    };
    try {
      console.log('parseURL - Saving failed status:', updateFields);
      await doc.update(updateFields);
      console.log('parseURL - Successfully saved failed status');
    } catch (saveError) {
      console.error('parseURL - Failed to save failed status', saveError);
    }
  }
}


function getType(item: string): ItemType {
  const defaultType: ItemType = 'website';
  if (!item) {
    return defaultType;
  }
  const availableTypes: ItemType[] = ['video', 'article', 'profile', defaultType];
  let result: ItemType = defaultType;
  availableTypes.find(arrItem => {
    const contains = item.indexOf(arrItem) >= 0;
    if (contains) {
      result = arrItem;
    }
    return contains;
  });
  return result;
}


const getTagRemovedData = (tagId: string): any => {
  return {
    tags: admin.firestore.FieldValue.arrayRemove(tagId)
  };
};

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
      items.docs.forEach((itemDoc, index) => {
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
      type: 'roadmap'
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
        sendRoadmapActivityPushNotifications: null
      };
      return transaction.create(firestore.doc(`users/${user.uid}`), dbUser);
    }, { logPrefix: 'createUserInDB' });
    console.log('createUserInDB(): Success.', {user});
  } catch (error) {
    console.error('createUserInDB(): Failed to create a user in DB.', error, { user });
  }
}


export const https = httpsFunction;
export const onFileUpload = onFileUploadFunction;
