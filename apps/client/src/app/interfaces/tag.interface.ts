import { BaseEntity } from './baseEntity.interface';

export interface Tag extends BaseEntity {
  title: string
  color: string
  createdBy: string
  createdAt: Date
}
