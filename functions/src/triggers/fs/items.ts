import { featureParseURL, featureNewFinishedCounter, featureCheckUniquenessOfURL } from '../../features';
import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { Item } from '../../+utils/interfaces';

export const fsItems = getTriggerFirestoreOnWrite<Item>({
  collectionName: 'items',
  onCreate: async item => {
    await Promise.all([
      featureParseURL.onCreate(item),
      featureNewFinishedCounter.onCreate(item),
      featureCheckUniquenessOfURL.onCreate(item),
    ]);
  },
  onUpdate: async (before, after) => {
    await Promise.all([
      featureParseURL.onUpdate(before, after),
      featureNewFinishedCounter.onUpdate(before, after),
      featureCheckUniquenessOfURL.onUpdate(before, after),
    ]);
  }
});
