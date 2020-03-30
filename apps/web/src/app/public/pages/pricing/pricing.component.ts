import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-public-pricing-page',
  templateUrl: './pricing.component.pug',
  styleUrls: ['./pricing.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPageComponent {}
