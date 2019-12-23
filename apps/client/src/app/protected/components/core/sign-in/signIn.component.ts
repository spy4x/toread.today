import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ConnectionStatusService, LoggerService, UserService } from '../../../../services';
import { Router } from '@angular/router';

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
    public router: Router
  ) { }

  ngOnInit(): void {
    this.userService.finishSignInWithEmailLink();
  }
}
