import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-public-privacy-policy-page',
  templateUrl: './privacy-policy.component.pug',
  styleUrls: ['./privacy-policy.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyPageComponent {}
