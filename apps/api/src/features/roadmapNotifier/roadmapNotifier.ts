import { createNotification } from '../../+utils/common';
import { RoadmapBrick } from '../../+utils/interfaces';

const antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';

export const featureRoadmapNotifier = {
  onCreate: async (roadmapBrick: RoadmapBrick): Promise<void> => {
    await onCreate(roadmapBrick, 'featureRoadmapNotifier.onCreate():');
  },
  onUpdate: async (before: RoadmapBrick, after: RoadmapBrick): Promise<void> => {
    await onUpdate(before, after, 'featureRoadmapNotifier.onUpdate():');
  }
};


async function onCreate(brick: RoadmapBrick, logPrefix: string): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, brick);
    const promises = [
      createNotification({
        text: `New ${brick.type} has been created: Id:${brick.id} "${brick.title}" by userId:${brick.createdBy}.`,
        userId: antonId, 
        type: 'roadmap'
      }),
      createNotification({
        text:
          `Your ${brick.type} has been registered! Thank you for your commitment. 🤟`,
        userId: brick.createdBy, 
        type: 'roadmap'
      })
    ];
    await Promise.all(promises);
    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.log(`${logPrefix}`, error);
  }
}

async function onUpdate(before: RoadmapBrick, after: RoadmapBrick, logPrefix: string): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, { before, after });
    const promises = [];
    // Like START
    const newLikeId = after.likedBy.find(userId => before.likedBy.indexOf(userId) === -1);
    if (newLikeId && after.createdBy !== newLikeId) {
      promises.push(
        createNotification({
          text: `Yahoo! Somebody liked your ${after.type} "${after.title}". 👍`,
          userId: after.createdBy,
          type: 'roadmap'
        }));
    }
    // Like END

    // Approved START
    if (before.type === 'suggestion' && after.type === 'feature') {
      promises.push(createNotification(
        {
          text: `Your ${after.type} "${after.title}" was approved and is going to be implemented. 👍 Thanks for your help!`,
          userId: after.createdBy, type: 'roadmap'
        }));
    }
    // Approved END

    // inProgress START
    if (before.status === 'new' && after.status === 'inProgress') {
      promises.push(createNotification(
        {
          text: `Your ${after.type} "${after.title}" is in work. We'll update you once it's implemented. 😊`,
          userId: after.createdBy, type: 'roadmap'
        }));
    }
    // Done END

    // Done START
    if (before.status !== 'done' && after.status === 'done') {
      const version = `${after.releasedInVersion ? `v${after.releasedInVersion}` : 'new version'}`;
      promises.push(createNotification(
        {
          text: `Your roadmap ${after.type} "${after.title}" is implemented. Check it out in ${version}! 😉`,
          userId: after.createdBy, type: 'roadmap'
        }));
      const text = `Roadmap ${after.type} that you were interested in, "${after.title}" has been implemented. Check it out in ${version}! 😉`;
      after.likedBy.forEach(userIdWhoLiked => {
        if (userIdWhoLiked === after.createdBy) {
          return;
        }
        promises.push(createNotification({ text, userId: userIdWhoLiked, type: 'roadmap' }));
      });
    }
    // Done END
    await Promise.all(promises);
    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.log(`${logPrefix}`, error);
  }
}
