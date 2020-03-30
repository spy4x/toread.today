import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ConnectionStatusService {
  private _connectionMonitor = new BehaviorSubject<boolean>(navigator.onLine);
  isOnline$ = this._connectionMonitor.asObservable();

  constructor() {
    window.addEventListener('offline', () => {
      this._connectionMonitor.next(false);
    });
    window.addEventListener('online', () => {
      this._connectionMonitor.next(true);
    });
  }
}
