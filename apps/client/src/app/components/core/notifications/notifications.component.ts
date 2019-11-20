import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { catchError, first, map, shareReplay, takeUntil } from 'rxjs/operators';
import { Notification } from '../../../interfaces/notification.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../../services/logger.service';
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
  @ViewChild('dropdown', { static: true }) dropdown: ElementRef;
  componentDestroy$ = new Subject<void>();
  error$ = this.logger.lastErrorMessage$;
  dateFormat = 'd MMM yyyy HH:mm';
  notificationsLimit = 5;

  allNotifications$: Observable<Notification[]>;
  newNotifications$: Observable<Notification[]>;
  isAnyNewNotification$: Observable<boolean>;
  isAnyUnreadRoadmapNotifications$: Observable<boolean>;

  recentlyDeletedIds: string[] = [];


  constructor(private firestore: AngularFirestore,
              private logger: LoggerService) { }

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
          this.logger.error(
            { messageForDev: 'notifications$ error', messageForUser: 'Failed to fetch notifications.', error });
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
          this.logger.error(
            { messageForDev: 'notifications$ error', messageForUser: 'Failed to fetch notifications.', error });
          return of(false);
        })
      );

    this.error$.pipe(takeUntil(this.componentDestroy$)).subscribe(error => {
      if (error) {
        // make sure dropdown has class "is-active"
        const el = this.dropdown.nativeElement as HTMLElement;
        const cssClass = 'is-active';
        if (!el.classList.contains(cssClass)) {
          el.classList.add(cssClass);
        }
      }
    });
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
