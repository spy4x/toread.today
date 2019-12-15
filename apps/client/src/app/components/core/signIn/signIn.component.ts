import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnInit } from '@angular/core';
import { LoggerService, UserService, ConnectionStatusService } from '../../../services';

@Component({
  selector: 'tt-sign-in',
  templateUrl: './signIn.component.pug',
  styleUrls: ['./signIn.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent implements OnInit {
  email: string;
  password: string;

  constructor(
    public userService: UserService,
    public connectionStatus: ConnectionStatusService,
    public logger: LoggerService,
  ) { }

  ngOnInit(): void {
    this.userService.finishSignInWithEmailLink();
  }
}
