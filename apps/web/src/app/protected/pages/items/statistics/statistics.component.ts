import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { NewFinishedMonthlyStatistics } from '../../../interfaces';
import { curveMonotoneX } from 'd3-shape';
import { MultiSeries } from '@swimlane/ngx-charts';

@Component({
  selector: 'tt-statistics',
  templateUrl: './statistics.component.pug',
  styleUrls: ['./statistics.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent implements OnChanges {
  @Input() statistics: null | NewFinishedMonthlyStatistics = null;
  values: null | MultiSeries;
  seriesMeta = [
    // If you want to change order of series - update array indexes in this.createLines()
    { title: 'Added', color: 'orange' },
    { title: 'Finished', color: 'forestgreen' }
  ];
  colorScheme = {
    domain: this.seriesMeta.map(m => m.color)
  };
  curve = curveMonotoneX;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.statistics) {
      return;
    }
    this.values = this.createLines(this.statistics);
  }

  getColorBySeriesTitle(seriesTitle: string): string {
    return this.seriesMeta.find(m => m.title === seriesTitle).color;
  }

  private createLines(statistics: NewFinishedMonthlyStatistics): MultiSeries {
    return Object.values(statistics.days).reduce(
      (acc, dayStats, index) => {
        const date = new Date(statistics.year, statistics.month - 1, index + 1);
        // If you have changed order of series - update array indexes here
        acc[0].series.push({ value: dayStats.new, name: date });
        acc[1].series.push({ value: dayStats.finished, name: date });
        return acc;
      },
      this.seriesMeta.map(m => ({ name: m.title, series: [] }))
    );
  }
}
