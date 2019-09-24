export type RoadmapBrickStatus = 'new' | 'inProgress' | 'done';
export type RoadmapBrickType = 'feature' | 'bug' | 'suggestion';

export interface RoadmapBrick {
  id?: string
  status: RoadmapBrickStatus
  type: RoadmapBrickType
  title: string
  releasedInVersion: null | string
  score: number
  likedBy: string[]
  dislikedBy: string[]
  // lastCommentedAt: null | Date
  startWorkingAt: null | Date
  createdBy: string
  createdAt: Date
}

export const defaultRoadmapBrick: RoadmapBrick = {
  status: 'new',
  type: 'suggestion',
  title: '',
  releasedInVersion: null,
  score: 0,
  likedBy: [],
  dislikedBy: [],
  startWorkingAt: null,
  // lastCommentedAt: null,
  createdBy: null,
  createdAt: new Date()
};
