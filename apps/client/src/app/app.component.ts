import { Component, ViewEncapsulation } from '@angular/core';
import { UserService, PushNotificationsService, UpdateService } from './services';


@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  constructor(
    public userService: UserService,
    private updateService: UpdateService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    this.updateService.init();
    this.subscribeToNotifications();
  }

  subscribeToNotifications(): void {
    if (!this.pushNotificationsService.isGranted()) {
      return;
    }
    this.userService.activatePushNotifications();
  }
}
