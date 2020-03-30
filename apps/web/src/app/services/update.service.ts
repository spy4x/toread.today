import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval, BehaviorSubject } from 'rxjs';
import { ConnectionStatusService } from './connection-status/connection-status.service';
import { LoggerService } from './logger.service';
import { filter } from 'rxjs/operators';
const { appData } = require('../../../ngsw-config.json');

export interface AppVersionInfo {
  version: string;
  description: string;
}

@Injectable()
export class UpdateService {
  private _newVersionAvailable$ = new BehaviorSubject<AppVersionInfo>(null);
  newVersionAvailable$ = this._newVersionAvailable$.asObservable().pipe(filter(v => !!v));
  versionInfo = appData as AppVersionInfo;

  constructor(
    private connectionStatus: ConnectionStatusService,
    private swUpdate: SwUpdate,
    private logger: LoggerService
  ) {}

  init(): void {
    this.logVersion();
    this.subscribeToUpdateAvailable();
    this.checkForUpdateWhenAppBackOnline();
    this.checkForUpdateOnWindowFocus();
    this.checkForUpdateOnTimer();
  }

  logVersion(): void {
    if (appData) {
      this.logger.setVersion(appData.version);
    }
  }

  subscribeToUpdateAvailable(): void {
    this.swUpdate.available.subscribe(event => {
      const newVersionInfo = event.available.appData as AppVersionInfo;
      this.logger.log('New version available', { ...newVersionInfo });
      this._newVersionAvailable$.next(newVersionInfo);
    });
  }

  checkForUpdateWhenAppBackOnline(): void {
    this.connectionStatus.isOnline$.subscribe(value => {
      if (value) {
        this.checkForUpdate();
      }
    });
  }

  checkForUpdateOnWindowFocus(): void {
    // Set the name of the hidden property and the change event for visibility
    let hidden, visibilityChange;
    if (typeof document['hidden'] !== 'undefined') {
      // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }
    document.addEventListener(
      visibilityChange,
      () => {
        if (!document[hidden]) {
          this.checkForUpdate();
        }
      },
      false
    );
  }

  checkForUpdateOnTimer() {
    const minutes = 5; // once in X minutes - check for update
    interval(minutes * 60 * 1000).subscribe(() => this.checkForUpdate());
  }

  async checkForUpdate() {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      if (error.message !== 'Service workers are disabled or not supported by this browser') {
        this.logger.error({
          messageForDev: 'swUpdate.checkForUpdate() failed',
          messageForUser: 'Check for app update failed.',
          error
        });
      }
    }
  }

  async update() {
    try {
      await this.swUpdate.activateUpdate();
    } catch (error) {
      if (error.message !== 'Service workers are disabled or not supported by this browser') {
        this.logger.error({
          messageForDev: 'swUpdate.update() failed',
          messageForUser: 'App update failed. Try refresh page manually.',
          error
        });
      }
    }
    document.location.reload();
  }
}
