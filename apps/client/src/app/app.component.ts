import { Component, ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { interval, of } from 'rxjs';
import { catchError, startWith, tap } from 'rxjs/operators';
import { auth } from 'firebase/app';
import { ConnectionStatusService } from './services/connection-status/connection-status.service';
import { SwUpdate } from '@angular/service-worker';
import { AppVersionInfo } from '../appVersionInfo.interface';
import { LoggerService } from './services/logger.service';

const { appData } = require('../../ngsw-config.json');

@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  error$ = this.logger.lastErrorMessage$;
  user$ = this.angularFireAuth.authState.pipe(
    startWith(JSON.parse(localStorage.getItem('tt-user'))),
    tap(user => {
      localStorage.setItem('tt-user', JSON.stringify(user));
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.logger.error({messageForDev:'user$ error', messageForUser: 'Unable to resolve user information.', error});
      return of(null);
    }));

  isOnline: boolean;
  isNewVersionAvailable: boolean;
  appUpdateInfo: AppVersionInfo;
  appVersionInfo = appData as AppVersionInfo;

  constructor(private angularFireAuth: AngularFireAuth,
              private connectionStatus: ConnectionStatusService,
              private swUpdate: SwUpdate,
              private logger: LoggerService) {
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
    interval(60 * 1000).subscribe(() => this.checkForUpdate());
  }

  async checkForUpdate() {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      if (error.message !== 'Service workers are disabled or not supported by this browser') {
        this.logger.error({messageForDev:'swUpdate.checkForUpdate() failed', messageForUser:'Check for app update' +
            ' failed.', error});
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
}
