import { bucket, createId, firestore, functions } from '../+utils/firebase/firebase';
import { readFileSync, unlinkSync } from 'fs';
import { every, map } from 'async-parallel';
import { Item, ItemSkeleton } from '../+utils/interfaces/item.interface';
import { Notification } from '../+utils/interfaces/notification.interface';
import * as XRegExp from 'xregexp';
import { isUrl } from '../+utils/common/isURL';
import { Tag } from '../+utils/interfaces/tag.interface';
import { runTransaction } from '../+utils/firebase/runTransaction';

interface StorageFile {
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


/**
 * Creates missing tags
 * @param tagIdOrTitle tag id and new tag title. New tag will be created from tag title.
 * @param userId
 * @param cache Map of <tagIdOrTitle, tagId> to avoid massive calls to DB
 * @returns array of tags ids
 */
const getTagIdOrCreate = async (tagIdOrTitle: string, userId: string, cache: Map<string, string>): Promise<string> => {
    let tagId = cache.get(tagIdOrTitle);
    if (tagId) {
      return tagId;
    }

    tagId = await runTransaction<string>(async transaction => {
      const doc = await transaction.get(firestore.doc(`tags/${tagIdOrTitle}`));
      if (doc.exists && doc.data().createdBy === userId) {
        return doc.id;
      }

      const query = firestore
        .collection(`tags`)
        .where('title', '==', tagIdOrTitle)
        .where('createdBy', '==', userId)
        .limit(1);
      const snapshot = await transaction.get(query);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      // TODO: replace with factory function or service
      const newTag: Tag = {
        title: tagIdOrTitle,
        color: '#209cee',
        createdBy: userId,
        createdAt: new Date(),
      };
      const id = createId();
      transaction.create(firestore.doc(`tags/${id}`), newTag);
      return id;
    }, { logPrefix: 'getTagIdOrCreate' });
    cache.set(tagIdOrTitle, tagId);
    return tagId;
};


const idRegex = `[\\w-]+`;
/**
 * Regex for string like "users/USER_ID/imports/FILE_ID"
 */
export const storageHandlerRegexpImportFile = `
users\/(?<userId>${idRegex})\/    # users/USER_ID/
imports\/(?<fileId>${idRegex})$   # imports/FILE_ID`;
const regex = XRegExp(storageHandlerRegexpImportFile, 'x'); // x = free-spacing, newlines and line comments
const CONCURENT_URL_HANDLERS_POOL_SIZE = 1;

const deleteFiles = async (localPathToFile: string, storageFile: StorageFile): Promise<void> => {
  console.log('Removing files');
  if (localPathToFile) {
    unlinkSync(localPathToFile); // remove file from `/tmp/` to save memory for future functions
  }
  await bucket.file(storageFile.path).delete(); // remove file in storage
  console.log('Files were removed');
};

const createNotification = async (message: string, userId: string): Promise<void> => {
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

export const onFileUploadFunction = functions
  .runWith({
    memory: '2GB',
    timeoutSeconds: 540
  })
  .storage
  .object()
  .onFinalize(async (object) => {
    console.log('Path:', object.name);
    let localPathToFile: string;
    const storageFile: StorageFile = {
      path: object.name,
      mimeType: object.contentType,
      size: Number(object.size),
      createdAt: new Date(Date.parse(object.timeCreated)),
      md5: object.md5Hash,
      metadata: object.metadata as any
    };
    const statistics = {
      total: 0,
      added: 0,
      ignored: 0,
      notValid: 0
    };
    const tagsCache = new Map<string, string>();
    console.log('File:', storageFile);
    const variables = XRegExp.exec(storageFile.path, regex);
    if (!variables) {
      console.error('No variables =/');
      return;
    }
    const { userId, fileId } = variables;
    console.log('Params:', { userId, fileId });
    try {
      localPathToFile = `/tmp/${fileId}`;
      await bucket.file(storageFile.path).download({ destination: localPathToFile });
      console.log('File downloaded successfully');

      const fileBuffer = readFileSync(localPathToFile);
      const bulk: { items: ItemSkeleton[], tags: string[] } = JSON.parse(fileBuffer.toString());
      console.log('File has been read successfully', {items: bulk.items.length, tags: bulk.tags.length});

      await createNotification(`Parsing file with ${bulk.items.length} items`, userId);

      // TODO: Do I still need 'async-parallel' library if this operation is sequential?
      await every(bulk.items, async (itemSkeleton: ItemSkeleton, index: number) => {
        if (index && index % 100 === 0) {
          await createNotification(`${index} lines of ${bulk.items.length} parsed`, userId);
        }
        statistics.total++;
        if (!isUrl(itemSkeleton.url)) {
          statistics.notValid++;
          return true;
        }
        // Check URL for uniqueness and save to DB if it is
        await runTransaction(async transaction => {
          const query = firestore
            .collection(`items`)
            .where('url', '==', itemSkeleton.url)
            .where('createdBy', '==', userId)
            .limit(1);
          const snapshot = await transaction.get(query);
          if (!snapshot.empty) {
            statistics.ignored++;
            return true;
          }
          const tagsMix = [...bulk.tags, ...itemSkeleton.tags];
          const tagsIds = await map<string, string>(tagsMix, value => getTagIdOrCreate(value, userId, tagsCache), 1);

          // TODO: create item object with a factory function
          const newItem: Item = {
            ...itemSkeleton,
            tags: tagsIds,
            type: null,
            status: 'new',
            priority: 3,
            rating: 0,
            comment: '',
            withComment: false,
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
        }, {logPrefix: 'Check URL for uniqueness and save to DB if it is'});
        return true;
      }, CONCURENT_URL_HANDLERS_POOL_SIZE);
      console.log('URLs creation is finished. Statistics:', statistics);

      await deleteFiles(localPathToFile, storageFile);

      let message = 'File parsed. URLs: ';
      if (statistics.added) {
        message += `${statistics.added} created. `;
      }
      if (statistics.ignored) {
        message += `${statistics.ignored} ignored. `;
      }
      if (statistics.notValid) {
        message += `${statistics.notValid} not valid. `;
      }
      await createNotification(message, userId);
    } catch (error) {
      console.error('onFileUploadFunction', error);
      await deleteFiles(localPathToFile, storageFile);
      await createNotification('Parsing failed. Try again or notify developer', userId);
    }
  });
