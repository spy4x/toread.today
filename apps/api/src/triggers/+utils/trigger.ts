import { Change, EventContext, functions } from '../../+utils/firebase/firebase';
import { firestore } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import * as admin from 'firebase-admin';
import UserRecord = admin.auth.UserRecord;

enum FsTriggerType {
  created = 'created',
  updated = 'updated',
  deleted = 'deleted',
}

export const getTriggerFirestoreOnWrite = <T>(triggerInfo: FsTriggerInfo<T>) => {
  return functions.firestore
    .document(`${triggerInfo.collectionName}/{id}`)
    .onWrite(
      async (change: Change<firestore.DocumentSnapshot>, context: EventContext) => {
        const triggerType = getFsTriggerType(change);
        switch (triggerType) {
          case FsTriggerType.created: {
            if (triggerInfo.onCreate) {
              await triggerInfo.onCreate(extractEntity<T>(change.after));
            }
            break;
          }
          case FsTriggerType.updated: {
            if (triggerInfo.onUpdate) {
              const before = extractEntity<T>(change.before);
              const after = extractEntity<T>(change.after);
              await triggerInfo.onUpdate(before, after);
            }
            break;
          }
          case FsTriggerType.deleted: {
            if (triggerInfo.onDelete) {
              await triggerInfo.onDelete(extractEntity<T>(change.before));
            }
            break;
          }
        }
      });
};

export const getTriggerFirestoreOnCreate = <T>(triggerInfo: FsTriggerInfo<T>) => {
  return functions.firestore
    .document(`${triggerInfo.collectionName}/{id}`)
    .onCreate(async doc => {
      if (triggerInfo.onCreate) {
        await triggerInfo.onCreate(extractEntity(doc));
      }
    });
};

export const getTriggerAuthOnCreate = (triggerInfo: AuthTriggerInfo) => {
  return functions.auth
    .user()
    .onCreate(async user => {
      if (triggerInfo.handler) {
        await triggerInfo.handler(user);
      }
    });
};

export const getTriggerStorageOnFileUpload = (triggerInfo: StorageTriggerInfo) => {
  return functions
    .runWith({
      memory: '2GB',
      timeoutSeconds: 540
    })
    .storage
    .object()
    .onFinalize(async object => {
      if (triggerInfo.handler) {
        await triggerInfo.handler({
          path: object.name,
          mimeType: object.contentType,
          size: Number(object.size),
          createdAt: new Date(Date.parse(object.timeCreated)),
          md5: object.md5Hash,
          metadata: object.metadata as unknown as any
        });
      }
    });
};

function extractEntity<T>(doc: DocumentSnapshot): T {
  return { ...doc.data(), id: doc.id } as unknown as T;
}


function getFsTriggerType(change: Change<firestore.DocumentSnapshot>): FsTriggerType {
  if (!change.before.exists && change.after.exists) {
    return FsTriggerType.created;
  }

  if (change.before.exists && change.after.exists) {
    return FsTriggerType.updated;
  }

  if (!change.after.exists) {
    return FsTriggerType.deleted;
  }

  return FsTriggerType.deleted;
}

interface FsTriggerInfo<T> {
  collectionName: string
  onCreate?: (doc: T) => Promise<void>
  onUpdate?: (before: T, after: T) => Promise<void>
  onDelete?: (doc: T) => Promise<void>
}

interface AuthTriggerInfo {
  handler: (user: UserRecord) => Promise<void>
}

interface StorageTriggerInfo {
  handler: (file: StorageFile) => Promise<void>
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
