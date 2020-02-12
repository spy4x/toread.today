import { admin, firestore } from '../../+utils/firebase/firebase';
import { Tag } from '../../+utils/interfaces';
import { BatchSwarm } from '../../+utils/firebase/batchSwarm';

export const featureDeleteTag = async (before: Tag, after: Tag): Promise<void> => {
  const logPrefix = 'featureDeleteTag():';
  const wasMarkedForDeletion = !before.commandToDelete && after.commandToDelete;
  if (!wasMarkedForDeletion) {
    return;
  }
  console.log(`${logPrefix} Working on tag:`, after);
  try {
    const items = await firestore
      .collection('items')
      .where('tags', 'array-contains', after.id)
      .get();
    console.log(`${logPrefix}: Found items:`, items.docs.length);

    const batch = new BatchSwarm();
    items.docs.forEach(itemDoc => {
      const itemRef = firestore.doc('items/' + itemDoc.id);
      switch(after.commandToDelete){
        case 'onlyTag': {
          const data = getTagRemovedData(after.id);
          batch.update(itemRef, data);
          break;
        }
        case 'withItems': {
          batch.delete(itemRef);
          break;
        }
        default: {
          throw new Error(`Wrong "commandToDelete" value "${after.commandToDelete}"`);
        }
      }
    });
    batch.delete(firestore.doc('tags/' + after.id));
    await batch.commit();

    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, after, error);
  }
};

function getTagRemovedData(tagId: string): any {
  return {
    tags: admin.firestore.FieldValue.arrayRemove(tagId)
  };
}
