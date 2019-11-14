import { functions, Change, EventContext } from '../../+utils/firebase';
import { firestore } from 'firebase-functions';

export enum TriggerType {
  created = 'created',
  updated = 'updated',
  deleted = 'deleted',
}

export function getTriggerType(change: Change<firestore.DocumentSnapshot>): TriggerType {
  if (!change.before.exists && change.after.exists) {
    return TriggerType.created;
  }

  if (change.before.exists && change.after.exists) {
    return TriggerType.updated;
  }

  if (!change.after.exists) {
    return TriggerType.deleted;
  }

  return TriggerType.deleted;
}

export interface TriggerInfo<T> {
  collectionName: string
  onCreate?: (doc: T) => Promise<void>
  onUpdate?: (before: T, after: T) => any
  onDelete?: (doc: T) => any
}

export const getFirestoreOnWriteTrigger = <T>(triggerInfo: TriggerInfo<T>) => {
  return functions.firestore
    .document(`${triggerInfo.collectionName}/{id}`)
    .onWrite(
      async (change: Change<firestore.DocumentSnapshot>, context: EventContext) => {
        const triggerType = getTriggerType(change);
        switch (triggerType) {
          case TriggerType.created: {
            if (triggerInfo.onCreate) {
              await triggerInfo.onCreate({ ...change.after.data(), id: change.after.id } as unknown as T);
            }
            break;
          }
          case TriggerType.updated: {
            if (triggerInfo.onUpdate) {
              const before = { ...change.before.data(), id: change.before.id } as unknown as T;
              const after = { ...change.after.data(), id: change.after.id } as unknown as T;
              await triggerInfo.onUpdate(before, after);
            }
            break;
          }
          case TriggerType.deleted: {
            if (triggerInfo.onDelete) {
              await triggerInfo.onDelete({ ...change.before.data(), id: change.before.id } as unknown as T);
            }
            break;
          }
        }
      });
};
