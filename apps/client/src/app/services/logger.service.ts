import { ErrorHandler, Injectable } from '@angular/core';
import { User as FirebaseUser } from 'firebase';
import * as Sentry from '@sentry/browser';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}

  async handleError(error) {
    Sentry.withScope(scope => {
      scope.setExtra('debug', false);
      Sentry.captureException(error.originalError || error);
    });

    console.error(error);
    throw error;
  }
}

@Injectable()
export class LoggerService {
  private lastErrorMessageSubject = new BehaviorSubject<null | string>(null);
  lastErrorMessage$: Observable<null | string> = this.lastErrorMessageSubject.pipe(shareReplay(1));

  constructor() {
    if (environment.production && environment.sentry) {
      Sentry.init({ dsn: environment.sentry });
    }
  }

  setUser(user: FirebaseUser): void {
    const context = user ? { id: user.uid, email: user.email, username: user.displayName } : undefined;
    Sentry.configureScope(scope => {
      scope.setUser(context);
    });
  }

  setVersion(version: string): void {
    this.debug(`Version: ${version}`);
    Sentry.configureScope(scope => {
      scope.setExtra('Version', version);
    });
  }

  debug(message: string, params?: { [key: string]: any }) {
    if (environment.production) {
      Sentry.withScope(scope => {
        scope.addBreadcrumb({
          type: 'debug',
          message,
          data: params,
          timestamp: Date.now()
        });
      });
      return; // no output to console on production
    }
    console.log(message, params || '');
  }

  warn(message: string, params?: { [key: string]: any }) {
    console.warn(message, params || '');
    Sentry.withScope(scope => {
      scope.setExtra('params', params);
      scope.setLevel(Sentry.Severity.Warning);
      Sentry.captureMessage(message);
    });
  }

  error({ messageForDev, messageForUser, error, params }:
        { messageForDev: string, messageForUser?: string, error?: Error, params?: { [key: string]: any } }) {
    console.error(messageForDev, error, params);
    Sentry.withScope(scope => {
      scope.setExtra('message', messageForDev);
      scope.setExtra('params', params);
      scope.setLevel(Sentry.Severity.Error);
      Sentry.captureException(error);
    });
    if (messageForUser) {
      this.lastErrorMessageSubject.next(messageForUser);
    }
  }

  hideLastErrorMessage() {
    this.lastErrorMessageSubject.next(null);
  }
}
