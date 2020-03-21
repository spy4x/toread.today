import { Item, NewFinishedMonthlyStatistics } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import { runTransaction } from '../../+utils/firebase/runTransaction';
import { firestore as Firestore } from 'firebase-admin';
import { lastDayOfMonth } from 'date-fns';

const logPrefix = 'featureNewFinishedCounter():';

export const featureNewFinishedCounter = {
  onCreate: async (item: Item): Promise<void> => {
    if (item.status === 'new') {
      await changeCounter(item, { new: 1 });
    } else if (item.status === 'finished') {
      await changeCounter(item, { new: 1, finished: 1 });
    }
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    if (before.status !== 'finished' && after.status === 'finished') {
      await changeCounter(after, { finished: 1 });
    }
    if (before.status === 'finished' && after.status !== 'finished') {
      await changeCounter(before, { finished: -1 });
    }
  },
  onDelete: async (item: Item): Promise<void> => {
    await changeCounter(item, {
      new: -1,
      finished: item.status === 'finished' ? -1 : undefined
    });
  }
};

type ChangeType = -1 | 1;
type FieldsChange = {
  new?: ChangeType,
  finished?: ChangeType
};

async function changeCounter(item: Item, fields: FieldsChange): Promise<void> {
  try {
    console.log(`${logPrefix}.changeCounter() Working on:`, { item, fields });
    const promises: Promise<void>[] = Object.keys(fields).map(async field => {
      if (!fields[field]) {
        // field value is undefined, so it should be skipped
        return;
      }
      let date: Date, isDecrease = false;
      if (fields[field] > 0) {
        // we increase today's counter
        date = new Date();
      } else {
        isDecrease = true;
        if (field === 'new') {
          // we decrease counter of creation date
          date = (item.createdAt as any).toDate();
        }
        if (field === 'finished') {
          // we decrease counter of finish date
          date = (item.finishedAt as any).toDate();
        }
      }
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const documentPath = `counterNewFinished/${year}_${month}_${item.createdBy}`;
      const docRef = firestore.doc(documentPath);
      const wasCounterCreated = await createCounterIfNotExist(docRef, month, year, item.createdBy);

      if (isDecrease && wasCounterCreated) {
        console.error(`${logPrefix}.changeCounter(): inconsistency detected. Counter didn't exist, but it should.`, {
          documentPath,
          day,
          month,
          year,
          userId: item.createdBy,
          item,
        });
        // we shouldn't decrease newly created counter, because it will make it's value negative
        return;
      }

      const update: Partial<NewFinishedMonthlyStatistics> = {};
      update[`days.${day}.${field}`] = Firestore.FieldValue.increment(fields[field]) as any;
      update[field] = Firestore.FieldValue.increment(fields[field]) as any;
      await docRef.update(update);
    });

    await Promise.all(promises);

    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, error, { item, fields });
  }
}

/**
 * Checks if counter exists. If not - creates it
 * @param docRef
 * @param month
 * @param year
 * @param userId
 * returns boolean - was counter created?
 */
async function createCounterIfNotExist(docRef: Firestore.DocumentReference,
                                       month: number,
                                       year: number,
                                       userId: string): Promise<boolean> {
  return await runTransaction(async transaction => {
    const snapshot = await transaction.get(docRef);
    if (snapshot.exists) {
      return false;
    }
    const statistics: NewFinishedMonthlyStatistics = {
      days: {},
      month,
      year,
      new: 0,
      finished: 0,
      userId
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
    return true;
  }, { logPrefix });
}
