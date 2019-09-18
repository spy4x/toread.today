import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-items-list-line-loader',
  templateUrl: './items-list-line-loader.component.pug',
  styleUrls: ['./items-list-line-loader.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsListLineLoaderComponent {
}
