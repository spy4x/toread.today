import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { NewFinishedMonthlyStatistics } from '../../../interfaces/newFinishedStatistics.interface';
import lastDayOfMonth from 'date-fns/esm/lastDayOfMonth';

interface Point {
  name: string
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
    const thisMonthFirstDay = new Date(statistics.year, statistics.month - 1, 1);
    const maxDateOfMonth = lastDayOfMonth(thisMonthFirstDay);
    const maxDayNumberOfMonth = maxDateOfMonth.getDate();
    const addedPoints: Point[] = [];
    const finishedPoints: Point[] = [];

    for (let i = 1; i <= maxDayNumberOfMonth; i++) {
      const dayStats = statistics.days.find(day => day.day === i);
      if (dayStats) {
        addedPoints.push({ value: dayStats.new, name: dayStats.day + '' });
        finishedPoints.push({ value: dayStats.finished, name: dayStats.day + '' });
      } else {
        addedPoints.push({ value: 0, name: i + '' });
        finishedPoints.push({ value: 0, name: i + '' });
      }
    }
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
