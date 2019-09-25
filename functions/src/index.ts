import { onFileUploadFunction } from './st';
import * as ogs from 'open-graph-scraper';
import { httpsFunction } from './https';
import { Item, ItemType } from './+utils/interfaces/item.interface';
import { admin, firestore, functions } from './+utils/firebase/firebase';
import { isUrl } from './+utils/common/isURL';
import { RoadmapBrick } from './+utils/interfaces/roadmapBrick.interface';
import { createNotification } from './+utils/common/createNotification';

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
const MAX_BATCH_OPERATIONS = 500;

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

      let batchIndex = 0;
      const batches = [];
      batches[batchIndex] = firestore.batch();
      items.docs.forEach((itemDoc, index) => {
        const indexForCreatingNewBatch = MAX_BATCH_OPERATIONS * (batchIndex + 1);
        if (index === indexForCreatingNewBatch) {
          ++batchIndex;
          batches[batchIndex] = firestore.batch();
        }
        const itemRef = firestore.doc('items/' + itemDoc.id);
        const data = getTagRemovedData(tag.id);
        batches[batchIndex].update(itemRef, data);
      });
      await Promise.all(batches.map(b => b.commit()));
      console.log('onTagDelete - Success');
    } catch (error) {
      console.error('onTagDelete', tag, error);
    }
  });


export const onRoadmapBrickCreate = functions.firestore
  .document(`roadmapBricks/{id}`)
  .onCreate(async doc => {
    const brick = { ...doc.data(), id: doc.id } as RoadmapBrick;
    const notifForAnton = createNotification(
      `New ${brick.type} has been created: ${brick.id} ${brick.title} by ${brick.createdBy}.`,
      antonId);
    const notifForAuthor = createNotification(
      `Your ${brick.type} has been registered! Thank you for your commitment. 🤟`,
      brick.createdBy);
    await Promise.all([notifForAnton, notifForAuthor]);
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
        createNotification(`User ${newLikeId} liked ${after.type} ${after.id} "${after.title}".`, antonId));
      promises.push(
        createNotification(`Yahoo! Somebody liked your ${after.type} "${after.title}". 👍`, after.createdBy));
    }
    // Like END

    // Approved START
    if (before.type === 'suggestion' && after.type === 'feature') {
      promises.push(createNotification(
        `Your ${after.type} "${after.title}" was approved and is going to be implemented. 👍 Thanks for your help!`,
        after.createdBy));
    }
    // Approved END

    // inProgress START
    if (before.status === 'new' && after.status === 'inProgress') {
      promises.push(createNotification(
        `Your ${after.type} "${after.title}" is in work. We'll update you once it's implemented. 😊`,
        after.createdBy));
    }
    // Done END

    // Done START
    if (before.status !== 'done' && after.status === 'done') {
      const version = `${after.releasedInVersion ? `v${after.releasedInVersion}` : 'new version'}`;
      promises.push(createNotification(
        `Your roadmap ${after.type} "${after.title}" is implemented. Check it out in ${version}! 😉`,
        after.createdBy));
      const message = `Roadmap ${after.type} that you were interested in, "${after.title}" has been implemented. Check it out in ${version}! 😉`;
      after.likedBy.forEach(userIdWhoLiked => {
        if (userIdWhoLiked === after.createdBy) {
          return;
        }
        promises.push(createNotification(message, userIdWhoLiked));
      });
    }
    // Done END
    await Promise.all(promises);
  });

export const https = httpsFunction;
export const onFileUpload = onFileUploadFunction;
