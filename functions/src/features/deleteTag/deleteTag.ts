import { admin, firestore } from '../../+utils/firebase/firebase';
import { Tag } from '../../+utils/interfaces';
import { BatchSwarm } from '../../+utils/firebase/batchSwarm';

export const featureDeleteTag = async (tag: Tag): Promise<void> => {
  const logPrefix = 'featureDeleteTag():';
  console.log(`${logPrefix} Working on tag:`, tag);
  try {
    const items = await firestore
      .collection('items')
      .where('tags', 'array-contains', tag.id)
      .get();
    console.log(`${logPrefix}: Found items:`, items.docs.length);

    const batch = new BatchSwarm();
    items.docs.forEach(itemDoc => {
      const itemRef = firestore.doc('items/' + itemDoc.id);
      const data = getTagRemovedData(tag.id);
      batch.update(itemRef, data);
    });
    await batch.commit();

    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, tag, error);
  }
};

function getTagRemovedData (tagId: string): any {
  return {
    tags: admin.firestore.FieldValue.arrayRemove(tagId)
  };
}
