import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Line, Point } from 'dl-chart';
import { NewFinishedMonthlyStatistics } from '../../../interfaces/newFinishedStatistics.interface';

@Component({
  selector: 'tt-dashboard-statistics',
  templateUrl: './statistics.component.pug',
  styleUrls: ['./statistics.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardStatisticsComponent implements OnChanges {
  @Input() statistics: null | NewFinishedMonthlyStatistics = null;
  values: null | Line[];

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.statistics) {
      return;
    }
    this.values = this.createLines(this.statistics);
  }

  private createLines(statistics: NewFinishedMonthlyStatistics): Line[] {
    const addedPoints: Point[] = [];
    const finishedPoints: Point[] = [];
    statistics.days.forEach(day => {
      addedPoints.push(new Point(day.day, day.new));
      finishedPoints.push(new Point(day.day, day.finished));
    });
    if (addedPoints.length < 5) {
      for (let i = 0, max = (5 - addedPoints.length); i < max; i++) {
        const maxPoint = addedPoints[addedPoints.length - 1];
        addedPoints.push(new Point(maxPoint.xValue + 1, 0));
        finishedPoints.push(new Point(maxPoint.xValue + 1, 0));
      }
    }
    return [
      {
        color: 'orange',
        cssClass: null,
        data: null,
        name: 'Saved',
        tooltipConfig: null,
        points: addedPoints
      },
      {
        color: 'green',
        cssClass: null,
        data: null,
        name: 'Finished',
        tooltipConfig: null,
        points: finishedPoints
      }
    ];
  }
}
