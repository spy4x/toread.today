import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../services/user.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { filter, map } from 'rxjs/operators';
import { User } from '../../interfaces/user.interface';
import { of } from 'rxjs';

const USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY = 'USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE';

@Component({
  selector: 'tt-ask-push-notifications',
  templateUrl: './ask-push-notifications.component.pug',
  styleUrls: ['./ask-push-notifications.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AskPushNotificationsComponent {
  isVisible$ = this.userService
    .user$
    .pipe(
      filter(v => !!v),
      map(
        (user: User) => !!user.sendRoadmapActivityPushNotifications && this.pushNotificationsService.isDefault() &&
          !this.isDisabledInLocalStorage())
    );

  constructor(private userService: UserService,
              private pushNotificationsService: PushNotificationsService) {}

  activate(): void {
    this.userService.activatePushNotifications();
    this.isVisible$ = of(false);
  }

  dismiss(): void {
    localStorage.setItem(USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY, 'true');
    this.isVisible$ = of(false);
  }

  private isDisabledInLocalStorage(): boolean {
    return localStorage.getItem(USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY) === 'true';
  }
}
