import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ogs from 'open-graph-scraper';

const URL = require('url').URL;

admin.initializeApp();
const firestore = admin.firestore();

type ItemStatus = 'new' | 'opened' | 'finished'
type ItemType = null | 'website' | 'video' | 'article' | 'profile'
type ItemURLParseStatus = 'notStarted' | 'done' | 'error'

interface Item {
  id: null | string
  url: string
  title: null | string
  createdBy: string
  createdAt: Date
  tags: string[]
  priority: 1 | 2 | 3
  isFavourite: boolean
  type: ItemType
  status: ItemStatus
  openedAt: null | Date
  finishedAt: null | Date
  urlParseStatus: ItemURLParseStatus
  urlParseError: null | string
}


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
    const before = {...change.before.data(), id: change.before.id} as Item;
    const after = {...change.after.data(), id: change.after.id} as Item;
    if (after.urlParseStatus === 'notStarted' && before.urlParseStatus !== 'notStarted' ) {
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

function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

async function parseURL(item: Item): Promise<void> {
  console.log('parseURL - Working on:', item.id, item.url);
  const doc = firestore.doc('items/' + item.id);
  try {
    const { data } = await ogs({ url:item.url });
    const updateFields: Partial<Item> = {
      title: data.ogTitle as string || null,
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


export const onTagDelete = functions.firestore
  .document(`tags/{id}`)
  .onDelete(async doc => {
    const id = doc.id;
    const tag = { ...doc.data(), id: doc.id };
    console.log('onTagDelete - Working on tag:', id, tag);
    try {
      const items = await firestore
        .collection('items')
        .where('tags', 'array-contains', id)
        .get();

      console.log('onTagDelete - Found items:', items.docs.length, items.docs.map(d => d.id));

      const data = {
        tags: admin.firestore.FieldValue.arrayRemove(id)
      };

      const batch = firestore.batch();
      items.docs.forEach(d => batch.update(firestore.doc('items/' + d.id), data));
      await batch.commit();
      console.log('onTagDelete - Success');
    } catch (error) {
      console.error('onTagDelete', tag, error);
    }
  });
