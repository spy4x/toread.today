import { getTriggerFirestoreOnWrite } from '../+utils/trigger';
import { RoadmapBrick } from '../../+utils/interfaces';
import { featureRoadmapNotifier } from '../../features';

export const fsRoadmapBricks = getTriggerFirestoreOnWrite<RoadmapBrick>({
  collectionName: 'roadmapBricks',
  onCreate: async roadmapBrick => {
    await featureRoadmapNotifier.onCreate(roadmapBrick);
  },
  onUpdate: async (before, after) => {
    await featureRoadmapNotifier.onUpdate(before, after);
  }
});
