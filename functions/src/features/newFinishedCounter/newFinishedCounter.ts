import { Item, NewFinishedMonthlyStatistics } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import { runTransaction } from '../../+utils/firebase/runTransaction';

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
    await runTransaction(async transaction => {
      const docRef = firestore.doc(`counterNewFinished/${year}_${month}_${item.createdBy}`);
      const doc = await transaction.get(docRef);
      let statistics: NewFinishedMonthlyStatistics;
      if (doc.exists) {
        statistics = { ...doc.data(), id: doc.id } as NewFinishedMonthlyStatistics;
        if (!statistics.days.find(d => d.day === day)) {
          statistics.days.push({
            day,
            new: 0,
            finished: 0
          });
        }
      } else {
        statistics = {
          days: [
            {
              day,
              new: 0,
              finished: 0
            }
          ],
          month,
          year,
          new: 0,
          finished: 0,
          userId: item.createdBy
        };
      }
      const stDay = statistics.days.find(d => d.day === day);
      fieldsToIncrease.forEach(field => {
        stDay[field]++;
        statistics[field]++;
      });
      const { id, ...body } = statistics;
      transaction.set(docRef, body);
    }, { logPrefix });
    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, error);
  }
}
