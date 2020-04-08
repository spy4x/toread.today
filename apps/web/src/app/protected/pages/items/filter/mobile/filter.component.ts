import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ItemsFilterBaseComponent } from '../base/filter.component';

@Component({
  selector: 'tt-items-filter-mobile',
  templateUrl: './filter.component.pug',
  styleUrls: ['./filter.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsFilterMobileComponent extends ItemsFilterBaseComponent {}
