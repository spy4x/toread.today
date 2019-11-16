import { featureParseURL } from '../../features';
import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { Item } from '../../+utils/interfaces';

export const fsItems = getTriggerFirestoreOnWrite<Item>({
  collectionName: 'items',
  onCreate: async item => {
    await featureParseURL.onCreate(item);
  },
  onUpdate: async (before, after) => {
    await featureParseURL.onUpdate(before, after);
  }
});
