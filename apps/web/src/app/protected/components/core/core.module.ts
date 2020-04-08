import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications/notifications.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SharedModule } from '../shared/shared.module';
import { SignInComponent } from './sign-in/signIn.component';
import { ProtectedFooterComponent } from './footer/footer.component';

@NgModule({
  declarations: [NotificationsComponent, NavbarComponent, ProtectedFooterComponent, SignInComponent],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [
    CommonModule,
    RouterModule,
    SharedModule,
    NotificationsComponent,
    NavbarComponent,
    ProtectedFooterComponent,
    SignInComponent
  ]
})
export class CoreModule {}
