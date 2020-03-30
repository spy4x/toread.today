import { firestore } from '../../+utils/firebase/firebase';
import { Tag } from '../../+utils/interfaces';
import { BatchSwarm } from '../../+utils/firebase/batchSwarm';
import {firestore as firestoreNamespace} from 'firebase-admin';

export const featureMergeTags = async (before: Tag, after: Tag): Promise<void> => {
  if (before.mergeIntoTagId === null && after.mergeIntoTagId !== null) {
    const tagTo = await firestore.doc(`tags/${after.mergeIntoTagId}`).get();
    if (!tagTo.exists || after.createdBy !== tagTo.data().createdBy) {
      return;
    }
    await mergeTags(after.id, after.mergeIntoTagId);
  }
};

async function mergeTags (tagIdFrom: string, tagIdTo: string): Promise<void> {
  const logPrefix = `mergeTags():`;
  console.log(`${logPrefix} Start`, { tagIdFrom, tagIdTo });
  try {
    const fetchLimit = 250;
    const items = await firestore
      .collection(`items`)
      .where('tags', 'array-contains', tagIdFrom)
      .limit(fetchLimit)
      .get();
    const itemsFetched = items.docs.length;
    console.log(`${logPrefix} Fetched ${itemsFetched} items for tag "${tagIdFrom}".`);
    const batch = new BatchSwarm();
    items.docs.forEach(itemDoc => {
      const itemRef = firestore.doc('items/' + itemDoc.id);
      batch.update(itemRef, { tags: firestoreNamespace.FieldValue.arrayUnion(tagIdTo) });
      batch.update(itemRef, { tags: firestoreNamespace.FieldValue.arrayRemove(tagIdFrom) });
    });
    await batch.commit();
    console.log(`${logPrefix} Updated ${itemsFetched} items.`);

    if (itemsFetched === fetchLimit) {
      console.log(`${logPrefix} Batch Success. Fetching next batch...`);
      await mergeTags(tagIdFrom, tagIdTo);
    } else {
      await firestore.doc(`tags/${tagIdFrom}`).delete();
      console.log(`${logPrefix} Tag "${tagIdFrom}" was deleted.`);
      console.log(`${logPrefix} Success.`);
    }
  } catch (error) {
    console.error(`${logPrefix}`, error);
  }
}
