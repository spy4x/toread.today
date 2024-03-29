import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class PushNotificationsService {
  constructor(private messaging: AngularFireMessaging) {}

  isSupported(): boolean {
    return 'Notification' in window;
  }

  isDenied(): boolean {
    return this.isSupported() && Notification.permission === 'denied';
  }

  isDefault(): boolean {
    return this.isSupported() && Notification.permission === 'default';
  }

  isGranted(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  getToken$(): Observable<null | string> {
    return this.messaging.requestToken.pipe(
      catchError(() => of(null)) // User rejected notifications API request or it's not supported by browser
    );
  }
}
