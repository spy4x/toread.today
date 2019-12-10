import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UserService, PushNotificationsService } from '../../services';

@Component({
  selector: 'tt-profile',
  templateUrl: './profile.component.pug',
  styleUrls: ['./profile.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {

  constructor(public userService: UserService,
              public messagingService: PushNotificationsService) { }
}
