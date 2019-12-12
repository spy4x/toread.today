import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { LoggerService, UserService, ConnectionStatusService } from '../../../services';

@Component({
  selector: 'tt-sign-in',
  templateUrl: './signIn.component.pug',
  styleUrls: ['./signIn.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent {
  constructor(
    public userService: UserService,
    public connectionStatus: ConnectionStatusService,
    public logger: LoggerService,
  ) { }
}
