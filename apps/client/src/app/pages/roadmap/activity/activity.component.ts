import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, filter, first, map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { LoggerService } from '../../../services/logger.service';
import { Notification } from '../../../interfaces/notification.interface';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';

@Component({
  selector: 'tt-roadmap-activity',
  templateUrl: './activity.component.pug',
  styleUrls: ['./activity.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadmapActivityComponent implements OnInit, OnDestroy {
  componentDestroy$ = new Subject<void>();
  dateFormat = 'd MMM yyyy HH:mm';
  notificationsLimit = 5;

  userId: null | string;
  user$ = this.auth.authState.pipe(
    takeUntil(this.componentDestroy$),
    tap(user => {
      this.userId = user ? user.uid : null;
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.logger.error({ messageForDev: 'user$ error', error });
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));

  allNotifications$: Observable<Notification[]> = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection<Notification>('notifications', ref =>
          ref
            .where('userId', '==', user.uid)
            .where('type', '==', 'roadmap')
            .orderBy('createdAt', 'desc')
            .limit(this.notificationsLimit)
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )
    ),
    catchError(error => {
      this.logger.error(
        { messageForDev: 'allNotifications$ error', messageForUser: 'Failed to fetch activity', error });
      return of([]);
    }),
    shareReplay(1)
  );
  newNotifications$: Observable<Notification[]>;
  isAnyNewNotification$: Observable<boolean>;
  recentlyDeletedIds: string[] = [];


  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  ngOnInit(): void {
    // this.allNotifications$ = this.firestore
    //   .collection<Notification>('notifications', ref =>
    //     ref
    //       .where('userId', '==', this.userId)
    //       .where('type', '==', 'roadmap')
    //       .orderBy('createdAt', 'desc')
    //       .limit(10)
    //   )
    //   .valueChanges({ idField: 'id' })
    //   .pipe(
    //     takeUntil(this.componentDestroy$),
    //     shareReplay(1),
    //     catchError(error => {
    //       this.logger.error(
    //         { messageForDev: 'allNotifications$ error', messageForUser: 'Failed to fetch roadmap activity.', error });
    //       return of([]);
    //     })
    //   );
    this.newNotifications$ = this.allNotifications$.pipe(
      map((notifications: Notification[]) => notifications.filter(n => n.status === 'new'))
    );
    this.isAnyNewNotification$ = this.newNotifications$.pipe(
      map((notifications: Notification[]) => !!notifications.length)
    );
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  markNewAsRead(): void {
    this.newNotifications$.pipe(first()).subscribe((notifications: Notification[]) => {
      notifications.forEach(n => this.markAsRead(n.id));
    });
  }

  async markAsRead(id: string) {
    if (this.recentlyDeletedIds.includes(id)) {
      return;
    }
    const data: Partial<Notification> = {
      status: 'read'
    };
    try {
      await this.firestore
        .doc('notifications/' + id)
        .update(data);
    } catch (error) {
      this.logger.error({
        messageForDev: 'markAsRead() error:',
        messageForUser: 'Failed to mark notification as read.',
        error,
        params: { id, data }
      });
    }
  }

  async delete(id: string) {
    try {
      this.recentlyDeletedIds.push(id);
      await this.firestore
        .doc('notifications/' + id)
        .delete();
    } catch (error) {
      this.logger.error(
        { messageForDev: 'delete() error:', messageForUser: 'Failed to delete notification.', error, params: { id } });
    }
  }

  hideError(): void {
    this.logger.hideLastErrorMessage();
  }
}
