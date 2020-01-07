import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, first, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { User as FirebaseUser, auth } from 'firebase/app';
import { FCMToken, User } from '../protected/interfaces';
import { LoggerService } from './logger.service';
import { PushNotificationsService } from './push-notifications.service';
import { NotificationsService } from './notifications.service';
import { environment } from '../../environments/environment';

enum AuthStates {
  authenticating = 'authenticating',
  notAuthenticated = 'notAuthenticated',
  authorising = 'authorising',
  authorized = 'authorized',
}

export enum AuthMethod {
  google = 'google',
  facebook = 'facebook',
  github = 'github',
  password = 'password',
  link = 'link',
}

@Injectable()
export class UserService {
  private _firebaseUser$ = new BehaviorSubject<null | FirebaseUser>(null);
  private _authState$ = new BehaviorSubject<AuthStates>(AuthStates.authenticating);
  private _userDoc$ = new BehaviorSubject<null | AngularFirestoreDocument<User>>(null);
  private _user$ = new BehaviorSubject<null | User>(null);
  private _signError$ = new BehaviorSubject<null | string>(null);
  private _signMessage$ = new BehaviorSubject<null | string>(null);
  private _isSignInProgress$ = new BehaviorSubject<boolean>(false);
  collectionPath = `users`;
  firebaseUser$ = this._firebaseUser$.asObservable();
  userId: null | string = null;
  userId$ = this._firebaseUser$.pipe(map(u => u ? u.uid : null), shareReplay(1));
  isAuthenticated$ = this._firebaseUser$.pipe(map(v => !!v));
  signedIn$ = this._firebaseUser$.pipe(filter(v => !!v));
  signedOut$ = this._firebaseUser$.pipe(filter(v => !v));
  authState$ = this._authState$.asObservable();
  user$ = this._user$.asObservable();
  authorizedUserOnly$: Observable<User> = this.user$.pipe(filter(v => !!v));
  isAuthorized$ = this._user$.pipe(map(v => !!v));
  authStates = AuthStates;
  authMethods = AuthMethod;
  oAuthMethods = [AuthMethod.google, AuthMethod.facebook, AuthMethod.github];
  signError$ = this._signError$.asObservable();
  signMessage$ = this._signMessage$.asObservable();
  isSignInProgress$ = this._isSignInProgress$.asObservable();
  pendingCredential: auth.AuthCredential;

  constructor(private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private pushNotificationsService: PushNotificationsService,
    private notificationsService: NotificationsService,
    private logger: LoggerService) {
    this.auth.authState.pipe(
      tap(async user => {
        this.userId = user ? user.uid : null;
        this.logger.setUser(user);
        this._authState$.next(user ? AuthStates.authorising : AuthStates.notAuthenticated);
        if (user) {
          this._isSignInProgress$.next(false);
          if (this.pendingCredential) {
            try {
              await user.linkWithCredential(this.pendingCredential);
            } catch (error) {
              this._signError$.next('Linking accounts failed.');
            }
          }
        }
      }),
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
              map((user: User) => ({ ...user, id: doc.ref.id })),
              tap(() => this._authState$.next(AuthStates.authorized)),
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

  async restorePassword(email: string): Promise<void> {
    this._signMessage$.next(null);
    this._signError$.next(null);
    try {
      if (!email) {
        this._signError$.next('Please fill email.');
        return;
      }
      this._isSignInProgress$.next(true);
      await this.auth.auth.sendPasswordResetEmail(email);
      this._isSignInProgress$.next(false);
      this._signMessage$.next('Check your email.');
    } catch (error) {
      this.logger.error({
        messageForDev: 'restorePassword() error',
        error
      });
      this._signError$.next(error.message);
      this._isSignInProgress$.next(false);
    }
  }

  async signUp(email: string, password?: string): Promise<void> {
    this._signMessage$.next(null);
    this._signError$.next(null);
    try {
      if (!email || !password) {
        this._signError$.next('Please fill email & password.');
        return;
      }
      this._isSignInProgress$.next(true);
      await this.auth.auth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
      this.logger.error({
        messageForDev: 'signUp() error',
        error
      });
      this._signError$.next(error.message);
      this._isSignInProgress$.next(false);
    }
  }

  async signIn(provider: AuthMethod, email?: string, password?: string): Promise<void> {
    this._signMessage$.next(null);
    this._signError$.next(null);
    try {
      switch (provider) {
        case AuthMethod.google: {
          this._isSignInProgress$.next(true);
          await this.auth.auth.signInWithPopup(new auth.GoogleAuthProvider());
          break;
        }
        case AuthMethod.facebook: {
          this._isSignInProgress$.next(true);
          await this.auth.auth.signInWithPopup(new auth.FacebookAuthProvider());
          break;
        }
        case AuthMethod.github: {
          this._isSignInProgress$.next(true);
          await this.auth.auth.signInWithPopup(new auth.GithubAuthProvider());
          break;
        }
        case AuthMethod.password: {
          if (!email || !password) {
            this._signError$.next('Please fill email & password.');
            return;
          }
          this._isSignInProgress$.next(true);
          await this.auth.auth.signInWithEmailAndPassword(email, password);
          break;
        }
        case AuthMethod.link: {
          if (!email) {
            this._signError$.next('Please fill email.');
            return;
          }
          this._isSignInProgress$.next(true);
          await this.auth.auth.sendSignInLinkToEmail(email, {
            handleCodeInApp: true,
            url: environment.frontendUrl + 'app'
          });
          this._isSignInProgress$.next(false);
          localStorage.setItem('emailForSignIn', email);
          this._signMessage$.next('Check your email.');
          break;
        }
      }
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        this.pendingCredential = error.credential;
        const methods = await this.auth.auth.fetchSignInMethodsForEmail(error.email);
        this._signError$.next(`You already have account for ${error.mail}. To link ${this.pendingCredential.providerId} to it - sign in with one of: ${methods.join(', ')}.`);
        this._isSignInProgress$.next(false);
        return;
      }

      this.logger.error({
        messageForDev: 'signIn() error',
        error
      });
      this._signError$.next(error.message);
      this._isSignInProgress$.next(false);
    }
  }

  async link(provider: AuthMethod): Promise<void> {
    this._signMessage$.next(null);
    this._signError$.next(null);
    this._isSignInProgress$.next(true);
    const providerObj = {
      'google': new auth.GoogleAuthProvider(),
      'facebook': new auth.FacebookAuthProvider(),
      'github': new auth.GithubAuthProvider(),
    }[provider]
    if (!providerObj) {
      return;
    }
    try {
      await this.firebaseUser.linkWithPopup(providerObj);
      this._isSignInProgress$.next(false);
      this._firebaseUser$.next(this.firebaseUser);
    } catch (error) {
      this.logger.error({
        messageForDev: 'link() error',
        error
      });
      this._signError$.next(error.message);
      this._isSignInProgress$.next(false);
    }
  }

  async unlink(provider: AuthMethod): Promise<void> {
    this._signMessage$.next(null);
    this._signError$.next(null);
    this._isSignInProgress$.next(true);
    const providerObj = {
      'google': new auth.GoogleAuthProvider(),
      'facebook': new auth.FacebookAuthProvider(),
      'github': new auth.GithubAuthProvider(),
    }[provider]
    if (!providerObj) {
      return;
    }
    try {
      await this.firebaseUser.unlink(providerObj.providerId);
      this._isSignInProgress$.next(false);
      this._firebaseUser$.next(this.firebaseUser);
    } catch (error) {
      this.logger.error({
        messageForDev: 'unlink() error',
        error
      });
      this._signError$.next(error.message);
      this._isSignInProgress$.next(false);
    }
  }

  async finishSignInWithEmailLink(): Promise<void> {
    try {
      if (!this.auth.auth.isSignInWithEmailLink(window.location.href)) {
        return;
      }
      var email = localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt('Please provide your email for confirmation');
        if (!email) {
          this._signError$.next('Email wasn\'t provided to finish Magic Link sign in. You can refresh page to try again');
          return;
        }
      }
      await this.auth.auth.signInWithEmailLink(email, window.location.href);
      localStorage.removeItem('emailForSignIn');
    } catch (error) {
      this.logger.error({
        messageForDev: 'finishSignInWithEmailLink() error',
        error
      });
      this._signError$.next(error.message);
    }
  }

  signOut(): void {
    this.auth.auth.signOut();
  }

  clearNotification(type: 'error' | 'message'): void {
    if (type === 'error') {
      this._signError$.next(null);
    }
    if (type === 'message') {
      this._signMessage$.next(null);
    }
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
    this.authorizedUserOnly$
      .pipe(
        take(1),
        switchMap(() => this
          .pushNotificationsService
          .getToken$()
          .pipe(
            filter(v => !!v),
            take(1),
            switchMap((token: string) => this.saveFCMToken(token)),
            catchError(error => {
              if (error.name === 'EmptyError') {
                // User denied browser's notifications request. We can do nothing now.
                return of(null);
              }
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
