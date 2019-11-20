import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import {
  NewFinishedDailyStatistics,
  NewFinishedMonthlyStatistics
} from '../../../interfaces/newFinishedStatistics.interface';

interface Point {
  name: number
  value: number
}

@Component({
  selector: 'tt-dashboard-statistics',
  templateUrl: './statistics.component.pug',
  styleUrls: ['./statistics.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardStatisticsComponent implements OnChanges {
  @Input() statistics: null | NewFinishedMonthlyStatistics = null;
  values: null | any[];
  colorScheme = {
    domain: ['orange', 'forestgreen']
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.statistics) {
      return;
    }
    this.values = this.createLines(this.statistics);
  }

  private createLines(statistics: NewFinishedMonthlyStatistics): any[] {
    const addedPoints: Point[] = [];
    const finishedPoints: Point[] = [];

    Object
      .values(statistics.days)
      .forEach((dayStats: NewFinishedDailyStatistics, index) => {
        const dayNumber = index+1;
        addedPoints.push({ value: dayStats.new, name: dayNumber });
        finishedPoints.push({ value: dayStats.finished, name: dayNumber });
      });

    return [
      {
        name: 'Saved',
        series: addedPoints
      },
      {
        name: 'Finished',
        series: finishedPoints
      }
    ];
  }
}
