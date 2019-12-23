import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { catchError, first, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { LoggerService, UserService } from '../../../../services';
import { User, Notification } from '../../../interfaces';

@Component({
  selector: 'tt-roadmap-activity',
  templateUrl: './activity.component.pug',
  styleUrls: ['./activity.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadmapActivityComponent implements OnInit, OnDestroy {
  @Input() user: User;
  @Output() setSettingSendRoadmapActivityPushNotifications = new EventEmitter<boolean>();
  componentDestroy$ = new Subject<void>();
  dateFormat = 'd MMM yyyy HH:mm';
  notificationsLimit = 5;
  // TODO: Move to NotificationService
  allNotifications$: Observable<Notification[]> = this.userService.authorizedUserOnly$.pipe(
    switchMap((user: User) =>
      this.firestore
        .collection<Notification>('notifications', ref =>
          ref
            .where('userId', '==', user.id)
            .where('type', '==', 'roadmap')
            .orderBy('createdAt', 'desc')
            .limit(this.notificationsLimit)
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userService.signedOut$),
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


  constructor(private userService: UserService,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  ngOnInit(): void {
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
