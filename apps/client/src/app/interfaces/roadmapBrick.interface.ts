export type RoadmapBrickStatus = 'new' | 'inProgress' | 'done';
export type RoadmapBrickType = 'feature' | 'fix' | 'suggestion';

export interface RoadmapBrick {
  id?: string
  status: RoadmapBrickStatus
  type: RoadmapBrickType
  title: string
  releasedInVersion: null | string
  likedBy: string[]
  dislikedBy: string[]
  startWorkingAt: null | Date
  createdBy: string
  createdAt: Date
}

export const defaultRoadmapBrick: RoadmapBrick = {
  status: 'new',
  type: 'feature',
  title: '',
  releasedInVersion: null,
  likedBy: [],
  dislikedBy: [],
  startWorkingAt: null,
  createdBy: null,
  createdAt: new Date()
};
