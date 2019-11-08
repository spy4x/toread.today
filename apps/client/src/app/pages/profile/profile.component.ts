import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../services/user.service';
import { PushNotificationsService } from '../../services/push-notifications.service';

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
