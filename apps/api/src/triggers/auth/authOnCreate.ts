import { featureCreateUserInDB } from '../../features';
import { getTriggerAuthOnCreate } from '../+utils/trigger';

export const authOnCreate = getTriggerAuthOnCreate({
  handler: async user => {
    await featureCreateUserInDB(user);
  }
});
