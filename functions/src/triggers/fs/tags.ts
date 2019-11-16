import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { featureDeleteTag, featureMergeTags } from '../../features';
import { Tag } from '../../+utils/interfaces';

export const fsTags = getTriggerFirestoreOnWrite<Tag>({
  collectionName: 'tags',
  onUpdate: async (before, after) => {
    await featureMergeTags(before, after);
  },
  onDelete: async tag => {
    await featureDeleteTag(tag);
  }
});
