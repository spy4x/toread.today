import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { RequestParams } from '../../../../services';

@Component({
  selector: 'tt-items-filter-description',
  templateUrl: './items-filter-description.component.pug',
  styleUrls: ['./items-filter-description.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsFilterDescriptionComponent implements OnChanges {
  @Input() params: RequestParams;
  description: string = '';
  orderByKeysReplacements = {
    createdAt: 'creation time',
    finishedAt: 'completion time',
    openedAt: 'opening time'
  };

  ngOnChanges(): void {
    const orderBy = this.params.sort.map(s => `${this.orderByKeysReplacements[s.field] || s.field}`).join(', ');
    this.description = `Ordered by ${orderBy}`;
  }
}
