import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import {
  catchError,
  filter,
  first,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
  throttleTime
} from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ItemsService } from '../../services/items/items.service';
import { Router } from '@angular/router';


@Component({
  selector: 'tt-dashboard',
  templateUrl: './dashboard.component.pug',
  styleUrls: ['./dashboard.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
  componentDestroy$ = new Subject<void>();
  error$ = new BehaviorSubject<string>(null);
  userId: null | string;
  user$ = this.auth.authState.pipe(
    takeUntil(this.componentDestroy$),
    startWith(JSON.parse(localStorage.getItem('tt-user'))),
    tap(user => {
      this.userId = user ? user.uid : null;
      localStorage.setItem('tt-user', JSON.stringify(user));
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.error$.next(error.message);
      this.logger.error({ messageForDev: 'user$ error', error });
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));

  tags$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('tags',
          ref => ref.where('createdBy', '==', user.uid).orderBy('title'))
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )
    ),
    catchError(error => {
      this.error$.next(error.message);
      this.logger.error({ messageForDev: 'tags$ error', error });
      return of([]);
    }),
    shareReplay(1)
  );

  getNewRandom$ = new BehaviorSubject<void>(null);
  randomItems$ = this.getNewRandom$
    .pipe(
      switchMap(() => this.user$.pipe(first())),
      filter(v => !!v),
      switchMap((user: User) => this.firestore
        .collection('items',
          ref => ref.where('createdBy', '==', user.uid).where('__name__', '>=', this.firestore.createId()).where(
            'status', '==', 'new').limit(3))
        .valueChanges({ idField: 'id' })
        .pipe(
          throttleTime(1000), // fixes bug related to that "where('__name__', '>=', v.randomId)" returns 1-2 emits instead of just 1
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )),
      catchError(error => {
        this.error$.next(error.message);
        this.logger.error(
          { messageForDev: 'randomItems$ error', messageForUser: 'Failed to fetch random items.', error });
        return of([]);
      })
    );

  openedItem$ = this.user$.pipe(
    first(),
    filter(v => !!v),
    switchMap((user: User) => this.firestore
      .collection('items',
        ref => ref.where('createdBy', '==', user.uid).where('status', '==', 'opened').orderBy('openedAt', 'desc').limit(
          3))
      .valueChanges({ idField: 'id' })
      .pipe(
        takeUntil(this.userIsNotAuthenticated$),
        takeUntil(this.componentDestroy$)
      )),
    catchError(error => {
      this.error$.next(error.message);
      this.logger.error(
        { messageForDev: 'openedItem$ error', messageForUser: 'Failed to fetch recently opened item.', error });
      return of([]);
    })
  );

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              public itemsService: ItemsService,
              public router: Router) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  showItemsWithTag(id: string): void {
    this.router.navigate([`/items`], {queryParams: {filterByTag:id}})
  }
}
