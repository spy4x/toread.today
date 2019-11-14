import { featureParseURL } from '../../features/parseURL/parseURL';
import { getFirestoreOnWriteTrigger, TriggerInfo } from '../+utils/trigger';
import { Item } from '../../+utils/interfaces';


const triggerInfo: TriggerInfo<Item> = {
  collectionName: 'items',
  onCreate: async item => {
    await featureParseURL.onCreate(item);
  },
  onUpdate: async (before, after) => {
    await featureParseURL.onUpdate(before, after);
  }
};
export const itemOnWriteTrigger = getFirestoreOnWriteTrigger(triggerInfo);
