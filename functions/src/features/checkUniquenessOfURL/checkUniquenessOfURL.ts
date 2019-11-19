import { Item } from '../../+utils/interfaces';
import { createId, firestore } from '../../+utils/firebase/firebase';
import { DuplicatedItemsInfo } from '../../+utils/interfaces/duplicatedItemsInfo.interface';
import { runTransaction } from '../../+utils/firebase/runTransaction';
import { firestore as Firestore } from 'firebase-admin';


export const featureCheckUniquenessOfURL = {
  onCreate: async (item: Item): Promise<void> => {
    await checkUniquenessOfURL(item, 'featureCheckUniquenessOfURL.checkUniquenessOfURL():');
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    if (before.url !== after.url) {
      await Promise.all([
        checkIfNeedToRemoveDuplicatedItemsInfoDoc(before,
          'featureCheckUniquenessOfURL.checkIfNeedToRemoveDuplicatedItemsInfoDoc():'),
        checkUniquenessOfURL(after, 'featureCheckUniquenessOfURL.checkUniquenessOfURL():')
      ]);
    }
  },
  onDelete: async (item: Item): Promise<void> => {
    await checkIfNeedToRemoveDuplicatedItemsInfoDoc(item,
      'featureCheckUniquenessOfURL.checkIfNeedToRemoveDuplicatedItemsInfoDoc():');
  }
};

async function checkUniquenessOfURL(item: Item, logPrefix: string): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, item);
    await runTransaction(async transaction => {
      const duplicatedItemsInfosQuery = firestore
        .collection(`duplicatedItemsInfos`)
        .where('url', '==', item.url)
        .where('userId', '==', item.createdBy)
        .limit(1);
      const duplicatedItemsInfosQuerySnapshot = await transaction.get(duplicatedItemsInfosQuery);
      if (!duplicatedItemsInfosQuerySnapshot.empty) {
        console.log(
          `${logPrefix} Existing DuplicatedItemsInfo found. Updating...`,
          duplicatedItemsInfosQuerySnapshot.docs[0].data()
        );
        const dupInfoDocRef = firestore.doc(`duplicatedItemsInfos/${duplicatedItemsInfosQuerySnapshot.docs[0].id}`);
        const update: Partial<DuplicatedItemsInfo> = { itemsIds: Firestore.FieldValue.arrayUnion(item.id) as any };
        transaction.update(dupInfoDocRef, update);
        return;
      } else {
        const duplicatedItemsQuery = firestore
          .collection(`items`)
          .where('url', '==', item.url)
          .where('createdBy', '==', item.createdBy)
          .limit(10);
        const duplicatedItemsQuerySnapshot = await transaction.get(duplicatedItemsQuery);
        if (duplicatedItemsQuerySnapshot.docs.length <= 1) {
          console.log(`${logPrefix} No duplicates found.`);
          return;
        }
        console.log(`${logPrefix} Duplicates found: ${duplicatedItemsQuerySnapshot.docs.length}`);
        const duplicatedItemsInfo: DuplicatedItemsInfo = {
          id: createId(),
          url: item.url,
          itemsIds: [...duplicatedItemsQuerySnapshot.docs.map(d => d.id)],
          userId: item.createdBy,
          createdAt: new Date()
        };
        console.log(`${logPrefix} Saving DuplicatedItemsInfo:`, duplicatedItemsInfo);
        const { id, ...body } = duplicatedItemsInfo;
        const doc = firestore.doc(`duplicatedItemsInfos/${id}`);
        transaction.create(doc, body);
      }
    }, { logPrefix });
    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(logPrefix, error);
  }
}

async function checkIfNeedToRemoveDuplicatedItemsInfoDoc(item: Item, logPrefix: string): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, item);
    await runTransaction(async transaction => {
      const query = firestore
        .collection(`duplicatedItemsInfos`)
        .where('url', '==', item.url)
        .where('userId', '==', item.createdBy)
        .limit(1);
      const querySnapshot = await transaction.get(query);
      if (querySnapshot.empty) {
        return;
      }
      const doc = querySnapshot.docs[0];
      const dupInfoDocRef = firestore.doc(`duplicatedItemsInfos/${doc.id}`);
      const duplicatedItemsInfo = { id: doc.id, ...doc.data() } as DuplicatedItemsInfo;
      console.log(
        `${logPrefix} Existing DuplicatedItemsInfo found.`,
        duplicatedItemsInfo
      );
      duplicatedItemsInfo.itemsIds = duplicatedItemsInfo.itemsIds.filter(id => id !== item.id);
      if (duplicatedItemsInfo.itemsIds.length === 1) {
        console.log(
          `${logPrefix} Deleting DuplicatedItemsInfo, because there are no more duplicates.`,
          duplicatedItemsInfo
        );
        transaction.delete(dupInfoDocRef);
      } else {
        console.log(
          `${logPrefix} Updating DuplicatedItemsInfo, because there are still some other duplicates.`,
          duplicatedItemsInfo
        );
        const update: Partial<DuplicatedItemsInfo> = { itemsIds: Firestore.FieldValue.arrayRemove(item.id) as any };
        transaction.update(dupInfoDocRef, update);
      }
    }, { logPrefix });
    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(logPrefix, error);
  }
}
