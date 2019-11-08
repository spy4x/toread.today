import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { BehaviorSubject, of } from 'rxjs';
import { FCMToken, User } from '../interfaces/user.interface';
import { User as FirebaseUser } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { catchError, filter, first, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { PushNotificationsService } from './push-notifications.service';
import { NotificationsService } from './notifications.service';


@Injectable()
export class UserService {
  collectionPath = `users`;
  private _firebaseUser$ = new BehaviorSubject<null | FirebaseUser>(null);
  firebaseUser$ = this._firebaseUser$.asObservable();
  isAuthenticated$ = this._firebaseUser$.pipe(map(v => !!v));
  signedIn$ = this._firebaseUser$.pipe(filter(v => !!v));
  signedOut$ = this._firebaseUser$.pipe(filter(v => !v));
  private _userDoc$ = new BehaviorSubject<null | AngularFirestoreDocument<User>>(null);
  private _user$ = new BehaviorSubject<null | User>(null);
  user$ = this._user$.asObservable();
  isAuthorized$ = this._user$.pipe(map(v => !!v));

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private pushNotificationsService: PushNotificationsService,
              private notificationsService: NotificationsService,
              private logger: LoggerService) {
    this.auth.authState.pipe(
      tap(user => this.logger.setUser(user)),
      catchError(error => {
        this.logger.error({
          messageForDev: 'Failed to authenticate user',
          messageForUser: error.message,
          error
        });
        return of(null);
      }),
      shareReplay(1)
    ).subscribe(this._firebaseUser$);

    this._firebaseUser$
      .pipe(
        filter(v => !!v),
        map(firebaseUser => this.firestore.doc<User>(`${this.collectionPath}/${firebaseUser.uid}`)),
        catchError(error => {
          this.logger.error({
            messageForDev: 'Failed to generate user document from Firebase User.',
            messageForUser: 'Authorization failed. Please try again.',
            error
          });
          return of(null);
        }),
        shareReplay(1)
      )
      .subscribe(this._userDoc$);

    this._userDoc$
      .pipe(
        filter(v => !!v),
        switchMap((doc: AngularFirestoreDocument) =>
          doc
            .valueChanges()
            .pipe(
              takeUntil(this.signedOut$),
              filter(v => !!v),
              map((user: User) => ({ ...user, id: doc.ref.id }))
            )
        ),
        catchError(error => {
          this.logger.error({
            messageForDev: 'Failed to fetch user from database.',
            messageForUser: 'Failed to fetch user information from database. Please try again.',
            error
          });
          return of(null);
        }),
        shareReplay(1)
      )
      .subscribe(this._user$);

    this.signedOut$.pipe(map(() => null)).subscribe(this._user$);
  }

  get user(): null | User {
    return this._user$.value;
  }

  get firebaseUser(): null | FirebaseUser {
    return this._firebaseUser$.value;
  }

  get isAuthenticated(): boolean {
    return !!this._firebaseUser$.value;
  }

  get isAuthorized(): boolean {
    return !!this.user;
  }

  async setSettingSendRoadmapActivityPushNotifications(value: boolean): Promise<void> {
    await this.update({ sendRoadmapActivityPushNotifications: value }, 'Failed to update push notification setting.');
    if (value) {
      this.activatePushNotifications();
      this.notificationsService.create({
        userId: this.user.id,
        text: 'Push notifications for related Roadmap activity were activated.'
      });
    }
  }

  activatePushNotifications(): void {
    this.user$
      .pipe(
        filter(v => !!v),
        first(),
        switchMap(() => this
          .pushNotificationsService
          .getToken$()
          .pipe(
            filter(v => !!v),
            first(),
            switchMap((token: string) => this.saveFCMToken(token)),
            catchError(error => {
              this.logger.error({
                error,
                messageForUser: 'Failed to activate push notifications.',
                messageForDev: 'UserService.activatePushNotifications(): Failed.'
              });
              return of(null);
            })
          )
        )
      )
      .subscribe();
  }

  async saveFCMToken(token: string): Promise<void> {
    let fcmTokens = this.user.fcmTokens;
    if (fcmTokens.find(fcmt => fcmt.token === token)) {
      return; // token already exists
    }
    const newToken: FCMToken = {
      token,
      createdAt: new Date()
    };
    fcmTokens = [...fcmTokens, newToken];
    await this.update(
      { fcmTokens },
      'Failed to save push notifications token.'
    );
  }

  private async update(data: Partial<User>, errorMessageForUser?: string): Promise<void> {
    const messageForUser = errorMessageForUser || 'Failed to update user';
    if (!data) {
      this.logger.error({
        messageForDev: 'UserService.update(): "data" is not provided',
        messageForUser,
        params: { data }
      });
      return;
    }
    if (!this.user) {
      this.logger.error({
        messageForDev: 'UserService.update(): user is not authenticated',
        messageForUser,
        params: { data, user: this.user }
      });
      return;
    }
    const body = this.getBodyWithoutId(data);
    try {
      await this.firestore
        .doc(this.getPathForId(this.user.id))
        .update(body);
    } catch (error) {
      this.logger.error({
        messageForDev: 'UserService.update(): database update request failed',
        messageForUser,
        error,
        params: { data, user: this.user }
      });
    }
  }

  private getBodyWithoutId(user: Partial<User>): Partial<User> {
    const { id, ...body } = user;
    return body;
  }

  private getPathForId(id: string): string {
    return `${this.collectionPath}/${id}`;
  }
}
