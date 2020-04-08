import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ItemsFilterBaseComponent } from '../base/filter.component';

@Component({
  selector: 'tt-items-filter-desktop',
  templateUrl: './filter.component.pug',
  styleUrls: ['./filter.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsFilterDesktopComponent extends ItemsFilterBaseComponent {}
