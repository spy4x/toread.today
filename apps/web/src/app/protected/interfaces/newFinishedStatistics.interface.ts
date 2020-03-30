import { BaseEntity } from './baseEntity.interface';

export interface NewFinishedMonthlyStatistics extends BaseEntity {
  days: { [dayNumber: number]: NewFinishedDailyStatistics };
  month: number;
  year: number;
  new: number;
  finished: number;
  userId: string;
}

export interface NewFinishedDailyStatistics {
  new: number;
  finished: number;
}
