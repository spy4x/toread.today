import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { catchError, debounceTime, filter, first, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { ItemsService } from '../../services/items/items.service';
import { RouterHelperService } from '../../services/routerHelper.service';
import { NewFinishedMonthlyStatistics } from '../../interfaces/newFinishedStatistics.interface';

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
    tap(user => {
      this.userId = user ? user.uid : null;
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.error$.next(error.message);
      this.logger.error({ messageForDev: 'user$ error', error });
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));
  month$ = new BehaviorSubject<number>(new Date().getMonth() + 1);
  year$ = new BehaviorSubject<number>(new Date().getFullYear());
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
          debounceTime(500), // fixes bug related to that "where('__name__', '>=', v.randomId)" returns 1-2 emits
          // instead of just 1
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )),
      catchError(error => {
        this.error$.next(error.message);
        this.logger.error(
          { messageForDev: 'randomItems$ error', messageForUser: 'Failed to fetch random items.', error });
        return of([]);
      }),
      shareReplay(1)
    );

  openedItems$ = this.user$.pipe(
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
        { messageForDev: 'openedItems$ error', messageForUser: 'Failed to fetch recently opened item.', error });
      return of([]);
    }),
    shareReplay(1)
  );

  statistics$: Observable<NewFinishedMonthlyStatistics> = combineLatest([
    this.user$.pipe(
      first(),
      filter(v => !!v)
    ),
    this.month$,
    this.year$
  ], (user, month, year) => ({ user, month, year }))
    .pipe(
      switchMap(({ user, month, year }: { user: User, month: number, year: number }) => {
        return this.firestore
          .doc<NewFinishedMonthlyStatistics>(`counterNewFinished/${year}_${month}_${user.uid}`)
          .valueChanges()
          .pipe(
            takeUntil(this.userIsNotAuthenticated$),
            takeUntil(this.componentDestroy$),
            catchError(() => {
              return of(null);
            })
          );
      }),
      shareReplay(1)
    );


  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              public itemsService: ItemsService,
              public routerHelper: RouterHelperService) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  prevMonth(): void {
    const month = this.month$.value;
    const year = this.year$.value;
    if (month === 1) {
      this.month$.next(12);
      this.year$.next(year - 1);
    } else {
      this.month$.next(month - 1);
    }
  }

  nextMonth(): void {
    const month = this.month$.value;
    const year = this.year$.value;
    if (month === 12) {
      this.month$.next(1);
      this.year$.next(year + 1);
    } else {
      this.month$.next(month + 1);
    }
  }
}
