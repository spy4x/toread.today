import { onFileUploadFunction } from './st';
import * as ogs from 'open-graph-scraper';
import { httpsFunction } from './https';
import { Item, ItemType } from './+utils/interfaces/item.interface';
import { admin, firestore, functions } from './+utils/firebase/firebase';
import { isUrl } from './+utils/common/isURL';

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
  }
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


export const https = httpsFunction;
export const onFileUpload = onFileUploadFunction;
