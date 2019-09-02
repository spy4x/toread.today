import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ogs from 'open-graph-scraper';
import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';
import * as XRegExp from 'xregexp';
import { readFileSync, unlinkSync } from 'fs';
import { every } from 'async-parallel';

const URL = require('url').URL;

admin.initializeApp();
const firestore = admin.firestore();
const bucket = admin.storage().bucket();

type ItemStatus = 'new' | 'opened' | 'finished'
type ItemType = null | 'website' | 'video' | 'article' | 'profile'
type ItemURLParseStatus = 'notStarted' | 'done' | 'error'

interface Item {
  id?: string
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

export type NotificationStatus = 'new' | 'read'
export type NotificationType = 'info'

export interface Notification {
  id?: string
  status: NotificationStatus
  type: NotificationType
  text: string
  userId: string
  createdAt: Date
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


const idRegex = `[\\w-]+`;

/**
 * Regex for string like "users/USER_ID/imports/FILE_ID"
 */
export const storageHandlerRegexpImportFile = `
users\/(?<userId>${idRegex})\/    # users/USER_ID/
imports\/(?<fileId>${idRegex})$   # imports/FILE_ID`;
const regex = XRegExp(storageHandlerRegexpImportFile, 'x'); // x = free-spacing, newlines and line comments
const CONCURENT_URL_HANDLERS_POOL_SIZE = 20;

export const onFileUpload = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .storage
  .object()
  .onFinalize(async (object: ObjectMetadata, context: functions.EventContext) => {
      console.log('Path:', object.name);
      const storageFile: StorageFile = {
        path: object.name,
        mimeType: object.contentType,
        size: Number(object.size),
        createdAt: new Date(Date.parse(object.timeCreated)),
        md5: object.md5Hash,
        metadata: object.metadata as any,
      };
      const statistics = {
        total: 0,
        added: 0,
        ignored: 0,
        notValid: 0,
      };
      console.log('File:', storageFile);
      try {
        const variables = XRegExp.exec(storageFile.path, regex);
        if (!variables) {
          console.error('No variables =/');
          return;
        }
        const { userId, fileId } = variables;
        console.log('Params:', { userId, fileId });
        const localPathToFile = `/tmp/${fileId}`;
        try {
          await bucket.file(storageFile.path).download({ destination: localPathToFile });
          console.log('File downloaded successfully');

          const metadata = (await bucket.file(storageFile.path).getMetadata())[0].metadata;

          const fileBuffer = readFileSync(localPathToFile);
          const fileContent = fileBuffer.toString();
          console.log('File has been read successfully');

          const separator = /[\r\n\t\f\v ]+/; // any spaces, tabs, \n
          const urls = fileContent.split(separator);
          console.log('Lines:', urls.length);

          console.log('Creating initial notification...');
          const initialNotification: Notification = {
            status: 'new',
            type: 'info',
            text: `Parsing file with ${urls.length} lines`,
            userId,
            createdAt: new Date()
          };
          await firestore.collection('notifications').add(initialNotification);
          console.log('Initial notification created.');

          await every(urls, async (url: string, index: number) => {
            console.log('Working on ', index);
            if (index && index % 100 === 0) {
              console.log('Creating progress notification...');
              const progressNotification: Notification = {
                status: 'new',
                type: 'info',
                text: `${index} lines parsed`,
                userId,
                createdAt: new Date()
              };
              await firestore.collection('notifications').add(progressNotification);
              console.log('Progress notification created.');
            }
            const value = url.trim();
            if (!value) {
              return true;
            }
            statistics.total++;
            if (!isUrl(value)) {
              statistics.notValid++;
              return true;
            }
            // Check URL for uniqueness and save to DB if it is
            await firestore.runTransaction(async transaction => {
              const query = firestore
                .collection(`items`)
                .where('url', '==', url)
                .where('createdBy', '==', userId)
                .limit(1);
              const snapshot = await transaction.get(query);
              if(!snapshot.empty) {
                statistics.ignored++;
                return true;
              }
              const newItem: Item = {
                url: url,
                tags: JSON.parse(metadata.tags),
                title: null,
                type: null,
                status: 'new',
                priority: 3,
                isFavourite: false,
                createdBy: userId,
                createdAt: new Date(),
                openedAt: null,
                finishedAt: null,
                urlParseError: null,
                urlParseStatus: 'notStarted'
              };
              transaction.create(firestore.collection(`items`).doc(createId()), newItem);
              statistics.added++;
              return true;
            });
            return true;
          }, CONCURENT_URL_HANDLERS_POOL_SIZE);
          console.log('URLs creation is finished. Statistics:', statistics);

          console.log('Removing files');
          unlinkSync(localPathToFile); // remove all stuff from `/tmp/` to save memory for future functions
          await bucket.file(storageFile.path).delete(); // remove file in storage
          console.log('Files were removed');

          console.log('Creating finished notification...');
          let message = 'File parsed. URLs: ';
          if(statistics.added){
            message+=`${statistics.added} created. `
          }
          if(statistics.ignored){
            message+=`${statistics.ignored} ignored. `
          }
          if(statistics.notValid){
            message+=`${statistics.notValid} not valid. `
          }
          const finishedNotification: Notification = {
            status: 'new',
            type: 'info',
            text: message,
            userId,
            createdAt: new Date()
          };
          await firestore.collection('notifications').add(finishedNotification);
          console.log('Finished notification created.');

        } catch (error) {
          console.error('Fail', error, { storageFile, localPathToFile });
        }
      } catch (error) {
        console.error('onFileUpload', error);
      }
  });


export function createId(): string {
  return firestore
    .collection('fakeCollection')
    .doc().id;
}

export interface StorageFile {
  /**
   * Path to file on Cloud storage
   */
  path: string;
  /**
   * Mime-type, like "image/png"
   */
  mimeType: string;
  /**
   * Bytes amount
   */
  size: number;
  createdAt: Date;
  md5: string;
  metadata: {
    firebaseStorageDownloadTokens: string;
  };
}
