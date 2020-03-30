import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications/notifications.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SharedModule } from '../shared/shared.module';
import { SignInComponent } from './sign-in/signIn.component';

@NgModule({
  declarations: [NotificationsComponent, NavbarComponent, SignInComponent],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [CommonModule, RouterModule, SharedModule, NotificationsComponent, NavbarComponent, SignInComponent]
})
export class CoreModule {}
