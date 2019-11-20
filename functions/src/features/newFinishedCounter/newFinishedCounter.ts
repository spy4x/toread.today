import { Item, NewFinishedMonthlyStatistics } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import { runTransaction } from '../../+utils/firebase/runTransaction';
import { firestore as Firestore} from 'firebase-admin';
import { lastDayOfMonth } from 'date-fns';

const logPrefix = 'featureNewFinishedCounter():';

export const featureNewFinishedCounter = {
  onCreate: async (item: Item): Promise<void> => {
    if (item.status === 'new') {
      await updateStatistics(item, ['new']);
    } else if (item.status === 'finished') {
      await updateStatistics(item, ['new', 'finished']);
    }
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    if (before.status !== 'finished' && after.status === 'finished') {
      await updateStatistics(after, ['finished']);
    }
  }
};

type FieldsType = 'new' | 'finished';

async function updateStatistics(item: Item, fieldsToIncrease: FieldsType[]): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, { item, fieldsToIncrease });
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const docRef = firestore.doc(`counterNewFinished/${year}_${month}_${item.createdBy}`);

    // checking if counter exists. If not - creating it.
    await runTransaction(async transaction => {
      const snapshot = await transaction.get(docRef);
      if (snapshot.exists) {
        return;
      }
      const statistics: NewFinishedMonthlyStatistics = {
        days: {},
        month,
        year,
        new: 0,
        finished: 0,
        userId: item.createdBy
      };
      const monthDate = new Date(statistics.year, statistics.month - 1);
      const daysInMonth = lastDayOfMonth(monthDate).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        statistics.days[i] = {
          new: 0,
          finished: 0
        };
      }
      const { id, ...body } = statistics;
      transaction.create(docRef, body);
    }, { logPrefix });

    // increasing counter
    const update: Partial<NewFinishedMonthlyStatistics> = {};
    fieldsToIncrease.forEach(field => {
      update[`days.${day}.${field}`] = Firestore.FieldValue.increment(1) as any;
      update[field] = Firestore.FieldValue.increment(1) as any;
    });
    await docRef.update(update);


    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, error);
  }
}
