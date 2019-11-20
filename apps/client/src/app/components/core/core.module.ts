import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications/notifications.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AskPushNotificationsComponent } from './ask-push-notifications/ask-push-notifications.component';

@NgModule({
  declarations: [
    NotificationsComponent,
    NavbarComponent,
    AskPushNotificationsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    NotificationsComponent,
    NavbarComponent,
    AskPushNotificationsComponent,
  ],
  providers: []
})
export class CoreModule {}
