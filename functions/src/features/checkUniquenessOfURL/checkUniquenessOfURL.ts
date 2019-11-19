import { Item } from '../../+utils/interfaces';
import { createId, firestore } from '../../+utils/firebase/firebase';
import { DuplicatedItemsInfo } from '../../+utils/interfaces/duplicatedItemsInfo.interface';
import { runTransaction } from '../../+utils/firebase/runTransaction';
import { firestore as Firestore } from 'firebase-admin';


export const featureCheckUniquenessOfURL = {
  onCreate: async (item: Item): Promise<void> => {
    await checkUniquenessOfURL(item, 'featureCheckUniquenessOfURL.onCreate():');
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    if (before.url !== after.url) {
      await checkUniquenessOfURL(after, 'featureCheckUniquenessOfURL.onUpdate():');
    }
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
