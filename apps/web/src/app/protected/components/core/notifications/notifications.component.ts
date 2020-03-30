import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { catchError, filter, map, merge, shareReplay, take, takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { Notification, User } from '../../../interfaces';
import { LoggerService, PushNotificationsService, UpdateService, UserService } from '../../../../services';
import { DropdownDirective } from '../../shared/dropdown/dropdown.directive';

const USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY =
  'USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE';

@Component({
  selector: 'tt-notifications',
  templateUrl: './notifications.component.pug',
  styleUrls: ['./notifications.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() userId: string;
  @ViewChild(DropdownDirective, { static: true }) dropdown: DropdownDirective;
  componentDestroy$ = new Subject<void>();
  error$ = this.logger.lastErrorMessage$;
  dateFormat = 'd MMM yyyy HH:mm';
  notificationsLimit = 5;
  recentlyDeletedIds: string[] = [];

  allNotifications$: Observable<Notification[]>;
  newNotifications$: Observable<Notification[]>;
  isAnyNewNotification$: Observable<boolean>;
  isAnyUnreadRoadmapNotifications$: Observable<boolean>;
  isPushNotificationsQuestionVisible$ = this.userService.authorizedUserOnly$.pipe(
    map(
      (user: User) =>
        !!user.sendRoadmapActivityPushNotifications &&
        this.pushNotificationsService.isDefault() &&
        !this.arePushNotificationsDisabledInLocalStorage()
    )
  );

  constructor(
    public updateService: UpdateService,
    private firestore: AngularFirestore,
    private logger: LoggerService,
    private userService: UserService,
    private pushNotificationsService: PushNotificationsService
  ) {}

  ngOnInit(): void {
    this.allNotifications$ = this.firestore
      .collection<Notification>('notifications', ref =>
        ref
          .where('userId', '==', this.userId)
          .where('type', '==', 'info')
          .orderBy('createdAt', 'desc')
          .limit(this.notificationsLimit)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        takeUntil(this.componentDestroy$),
        shareReplay(1),
        catchError(error => {
          this.logger.error({
            messageForDev: 'notifications$ error',
            messageForUser: 'Failed to fetch notifications.',
            error
          });
          return of([]);
        })
      );
    this.newNotifications$ = this.allNotifications$.pipe(
      map((notifications: Notification[]) => notifications.filter(n => n.status === 'new'))
    );
    this.isAnyNewNotification$ = this.newNotifications$.pipe(
      map((notifications: Notification[]) => !!notifications.length)
    );

    this.isAnyUnreadRoadmapNotifications$ = this.firestore
      .collection<Notification>('notifications', ref =>
        ref
          .where('userId', '==', this.userId)
          .where('type', '==', 'roadmap')
          .where('status', '==', 'new')
          .orderBy('createdAt', 'desc')
          .limit(1)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map((notifications: Notification[]) => !!notifications.length),
        takeUntil(this.componentDestroy$),
        shareReplay(1),
        catchError(error => {
          this.logger.error({
            messageForDev: 'notifications$ error',
            messageForUser: 'Failed to fetch notifications.',
            error
          });
          return of(false);
        })
      );
  }

  ngAfterViewInit(): void {
    this.error$
      .pipe(
        merge(this.isAnyNewNotification$),
        takeUntil(this.componentDestroy$),
        filter(v => !!v)
      )
      .subscribe(v => {
        this.dropdown.open();
      });
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  markNewAsRead(): void {
    this.newNotifications$.pipe(take(1)).subscribe((notifications: Notification[]) => {
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
      await this.firestore.doc('notifications/' + id).update(data);
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
      await this.firestore.doc('notifications/' + id).delete();
    } catch (error) {
      this.logger.error({
        messageForDev: 'delete() error:',
        messageForUser: 'Failed to delete notification.',
        error,
        params: { id }
      });
    }
  }

  hideError(): void {
    this.logger.hideLastErrorMessage();
  }

  activatePushNotifications(): void {
    this.userService.activatePushNotifications();
    this.isPushNotificationsQuestionVisible$ = of(false);
  }

  dismissPushNotifications(): void {
    localStorage.setItem(USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY, 'true');
    this.isPushNotificationsQuestionVisible$ = of(false);
  }

  private arePushNotificationsDisabledInLocalStorage(): boolean {
    return localStorage.getItem(USER_DOESNT_WANT_TO_RECEIVE_PUSH_NOTIFICATIONS_ON_THIS_DEVICE_KEY) === 'true';
  }
}
