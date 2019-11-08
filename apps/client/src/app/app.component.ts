import { Component, ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { interval } from 'rxjs';
import { auth } from 'firebase/app';
import { ConnectionStatusService } from './services/connection-status/connection-status.service';
import { SwUpdate } from '@angular/service-worker';
import { AppVersionInfo } from '../appVersionInfo.interface';
import { LoggerService } from './services/logger.service';
import { UserService } from './services/user.service';
import { PushNotificationsService } from './services/push-notifications.service';

const { appData } = require('../../ngsw-config.json');

@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  error$ = this.logger.lastErrorMessage$;

  isOnline: boolean;
  isNewVersionAvailable: boolean;
  appUpdateInfo: AppVersionInfo;
  appVersionInfo = appData as AppVersionInfo;

  constructor(private angularFireAuth: AngularFireAuth,
              private connectionStatus: ConnectionStatusService,
              private swUpdate: SwUpdate,
              private logger: LoggerService,
              public userService: UserService,
              private pushNotificationsService: PushNotificationsService) {
    if (appData) {this.logger.setVersion(appData.version);}
    this.connectionStatus.isOnline().subscribe(value => {
      this.isOnline = value;
      if (value) {
        this.checkForUpdate();
      }
    });
    this.swUpdate.available.subscribe(event => {
      this.isNewVersionAvailable = true;
      this.appUpdateInfo = event.available.appData as any;
      this.logger.debug('New version available', { ...this.appUpdateInfo });
    });

    this.checkForUpdateOnWindowFocus();
    this.runTimerThatChecksForUpdate();
    this.subscribeToNotifications();
  }

  checkForUpdateOnWindowFocus() {
    // Set the name of the hidden property and the change event for visibility
    let hidden, visibilityChange;
    if (typeof document['hidden'] !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }
    document.addEventListener(visibilityChange, () => {
      if (!document[hidden]) {
        this.checkForUpdate();
      }
    }, false);
  }

  runTimerThatChecksForUpdate() {
    const minutes = 10; // once in X minutes - check for update
    interval(minutes * 60 * 1000).subscribe(() => this.checkForUpdate());
  }

  async checkForUpdate() {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      if (error.message !== 'Service workers are disabled or not supported by this browser') {
        this.logger.error({
          messageForDev: 'swUpdate.checkForUpdate() failed', messageForUser: 'Check for app update' +
            ' failed.', error
        });
      }
    }
  }

  async update() {
    await this.swUpdate.activateUpdate();
    document.location.reload();
  }

  signIn() {
    this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  signOut() {
    this.angularFireAuth.auth.signOut();
  }

  subscribeToNotifications(): void {
    if (!this.pushNotificationsService.isGranted()) {
      return;
    }
    this.userService.activatePushNotifications();
  }
}
