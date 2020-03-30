import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { UserService, PushNotificationsService, AuthMethod } from '../../../services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'tt-profile',
  templateUrl: './profile.component.pug',
  styleUrls: ['./profile.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy {
  componentDestroy$ = new Subject();
  authProviders = this.userService.oAuthMethods.map(m => ({ provider: m, data: null }));

  constructor(public userService: UserService, public messagingService: PushNotificationsService) {}

  ngOnInit(): void {
    this.userService.firebaseUser$.pipe(takeUntil(this.componentDestroy$)).subscribe(user => {
      if (!user) {
        return;
      }
      this.authProviders.forEach(ap => {
        const provider = user.providerData.find(pd => pd.providerId === ap.provider + '.com');
        ap.data = provider ? `${provider.displayName} / ${provider.email}` : null;
      });
      this.authProviders = [...this.authProviders];
    });
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
  }
}
