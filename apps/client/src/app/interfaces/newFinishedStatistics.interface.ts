import { BaseEntity } from './baseEntity.interface';


export interface NewFinishedMonthlyStatistics extends BaseEntity {
  days: NewFinishedDailyStatistics[]
  month: number
  year: number
  new: number
  finished: number
  userId: string
}

export interface NewFinishedDailyStatistics {
  day: number
  new: number
  finished: number
}
