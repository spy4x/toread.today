import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UpdateService } from '../../../../services';

@Component({
  selector: 'tt-protected-footer',
  templateUrl: './footer.component.pug',
  styleUrls: ['./footer.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProtectedFooterComponent {
  constructor(public updateService: UpdateService) {}
}
