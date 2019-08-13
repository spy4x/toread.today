import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ConnectionStatusService {

  private connectionMonitor = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    window.addEventListener('offline', () => {
      this.connectionMonitor.next(false);
    });
    window.addEventListener('online', () => {
      this.connectionMonitor.next(true);
    });
  }

  isOnline(): Observable<boolean> {
    return this.connectionMonitor.asObservable();
  }
}
