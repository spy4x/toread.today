import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-public-features-page',
  templateUrl: './features.component.pug',
  styleUrls: ['./features.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesPageComponent {}
