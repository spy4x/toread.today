import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../../../services';

@Component({
  selector: 'tt-protected-page',
  templateUrl: './protected-page.component.pug',
  styleUrls: ['./protected-page.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProtectedPageComponent {
  constructor(public userService: UserService) {}
}
