import {
  featureCheckUniquenessOfURL,
  featureItemsCounter,
  featureNewFinishedCounter,
  featureParseURL
} from '../../features';
import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { Item } from '../../+utils/interfaces';

export const fsItems = getTriggerFirestoreOnWrite<Item>({
  collectionName: 'items',
  onCreate: async item => {
    await Promise.all([
      featureParseURL.onCreate(item),
      featureNewFinishedCounter.onCreate(item),
      featureCheckUniquenessOfURL.onCreate(item),
      featureItemsCounter.onCreate(item)
    ]);
  },
  onUpdate: async (before, after) => {
    await Promise.all([
      featureParseURL.onUpdate(before, after),
      featureNewFinishedCounter.onUpdate(before, after),
      featureCheckUniquenessOfURL.onUpdate(before, after),
      featureItemsCounter.onUpdate(before, after)
    ]);
  },
  onDelete: async item => {
    await Promise.all([
      featureCheckUniquenessOfURL.onDelete(item),
      featureItemsCounter.onDelete(item),
      featureNewFinishedCounter.onDelete(item),
    ]);
  }
});
