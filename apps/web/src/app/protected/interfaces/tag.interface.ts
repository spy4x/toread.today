import { BaseEntity } from './baseEntity.interface';

export type TagCommandToDeleteOption = null | 'onlyTag' | 'withItems';

export interface Tag extends BaseEntity {
  title: string;
  color: string;
  mergeIntoTagId: null | string;
  commandToDelete: TagCommandToDeleteOption;
  createdBy: string;
  createdAt: Date;
}
