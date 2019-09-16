import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, delay, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { Notification } from '../interfaces/notification.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../services/logger.service';
import { Observable, of, Subject } from 'rxjs';

@Component({
  selector: 'tt-notifications',
  templateUrl: './notifications.component.pug',
  styleUrls: ['./notifications.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  componentDestroy$ = new Subject<void>();
  error: string;
  areAllNotificationsVisible = false;
  dateFormat = 'd MMM yyyy HH:mm';

  allNotifications$: Observable<Notification[]>;
  newNotifications$: Observable<Notification[]>;
  isAnyNewNotification$: Observable<boolean>;


  constructor(private firestore: AngularFirestore,
              private logger: LoggerService) { }


  async markAsRead(id: string) {
    const data: Partial<Notification> = {
      status: 'read'
    };
    try {
      await this.firestore
        .doc('notifications/' + id)
        .update(data);
    } catch (error) {
      this.logger.error('markAsRead() error:', error, { id, data });
      this.error = error.message;
    }
  }

  async delete(id: string) {
    try {
      await this.firestore
        .doc('notifications/' + id)
        .delete();
    } catch (error) {
      this.logger.error('delete() error:', error, { id });
      this.error = error.message;
    }
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  ngOnInit(): void {
    this.allNotifications$ = this.firestore
      .collection<Notification>('notifications', ref =>
        ref
          .where('userId', '==', this.userId)
          .orderBy('createdAt', 'desc')
          .limit(5)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        takeUntil(this.componentDestroy$),
        shareReplay(1),
        catchError(error => {
          this.error = error.message;
          this.logger.error('notifications$ error', error);
          return of([]);
        })
      );
    this.newNotifications$ = this.allNotifications$.pipe(
      map((notifications: Notification[]) => notifications.filter(n => n.status === 'new'))
    );
    this.isAnyNewNotification$ = this.newNotifications$.pipe(
      map((notifications: Notification[]) => !!notifications.length)
    );
    this.newNotifications$.pipe(
      delay(5000),
      tap((notifications: Notification[]) => notifications.forEach(n => this.markAsRead(n.id)))
    ).subscribe();
  }

}
