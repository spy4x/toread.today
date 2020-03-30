import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { featureDeleteTag, featureMergeTags } from '../../features';
import { Tag } from '../../+utils/interfaces';

export const fsTags = getTriggerFirestoreOnWrite<Tag>({
  collectionName: 'tags',
  onUpdate: async (before, after) => {
    await Promise.all([
      featureMergeTags(before, after),
      featureDeleteTag(before, after),
    ]);
  }
});
