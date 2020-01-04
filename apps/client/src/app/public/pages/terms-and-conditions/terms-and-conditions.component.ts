import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-public-terms-and-conditions-page',
  templateUrl: './terms-and-conditions.component.pug',
  styleUrls: ['./terms-and-conditions.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsAndConditionsPageComponent {}
