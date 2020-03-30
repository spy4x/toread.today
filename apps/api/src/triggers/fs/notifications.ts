import { getTriggerFirestoreOnCreate } from '../+utils/trigger';
import { featureSendPushNotification } from '../../features';
import { Notification } from '../../+utils/interfaces';

export const fsNotifications = getTriggerFirestoreOnCreate<Notification>({
  collectionName: 'notifications',
  onCreate: async notification => {
    await featureSendPushNotification(notification);
  }
});
