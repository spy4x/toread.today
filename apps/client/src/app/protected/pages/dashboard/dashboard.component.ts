import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { ItemService, LoggerService, RouterHelperService, TagService, UserService } from '../../../services';
import { Item, NewFinishedMonthlyStatistics, User } from '../../interfaces';

@Component({
  selector: 'tt-dashboard',
  templateUrl: './dashboard.component.pug',
  styleUrls: ['./dashboard.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
  RECENT_ITEMS_LIMIT = 3;
  READ_TODAY_ITEMS_LIMIT = 10;
  componentDestroy$ = new Subject<void>();
  user$ = this.userService.authorizedUserOnly$;
  month$ = new BehaviorSubject<number>(new Date().getMonth() + 1);
  year$ = new BehaviorSubject<number>(new Date().getFullYear());
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  doesNextMonthExist$ = combineLatest(this.year$, this.month$, (year, month) => [year, month])
    .pipe(map(([year, month]: number[]) => {
      const today = new Date();
      return year <= today.getFullYear() && month <= today.getMonth();
    }));
  getNewRandom$ = new BehaviorSubject<void>(null);

  // TODO: Move to ItemService
  readTodayItems$ = this.getNewRandom$
    .pipe(
      switchMap(() => this.user$),
      switchMap((user: User) => this.firestore
        .collection<Item>('items',
          ref => ref
            .where('createdBy', '==', user.id)
            .where('status', '==', 'new')
            .orderBy('priority', 'desc')
            .orderBy('createdAt', 'desc')
            .limit(this.READ_TODAY_ITEMS_LIMIT)
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          debounceTime(500), // fixes bug related to that "where('__name__', '>=', v.randomId)" returns 1-2 emits instead of just 1
          takeUntil(this.userService.signedOut$),
          takeUntil(this.componentDestroy$)
        )),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'readTodayItems$ error', messageForUser: 'Failed to fetch recommended links.', error });
        return of([] as Item[]);
      }),
      shareReplay(1)
    );

  // TODO: Move to ItemService
  openedItems$ = this.user$.pipe(
    switchMap((user: User) => this.firestore
      .collection<Item>('items',
        ref => ref
          .where('createdBy', '==', user.id)
          .where('status', '==', 'opened')
          .orderBy('openedAt', 'desc')
          .limit(this.RECENT_ITEMS_LIMIT)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        takeUntil(this.userService.signedOut$),
        takeUntil(this.componentDestroy$)
      )),
    catchError(error => {
      this.logger.error(
        { messageForDev: 'openedItems$ error', messageForUser: 'Failed to fetch recently opened item.', error });
      return of([] as Item[]);
    }),
    shareReplay(1)
  );

  // TODO: Move to ItemService
  statistics$: Observable<NewFinishedMonthlyStatistics> = combineLatest([
    this.user$,
    this.month$,
    this.year$
  ], (user, month, year) => ({ user, month, year }))
    .pipe(
      switchMap(({ user, month, year }: { user: User, month: number, year: number }) => {
        return this.firestore
          .doc<NewFinishedMonthlyStatistics>(`counterNewFinished/${year}_${month}_${user.id}`)
          .valueChanges()
          .pipe(
            takeUntil(this.userService.signedOut$),
            takeUntil(this.componentDestroy$),
            catchError(() => {
              return of(null);
            })
          );
      }),
      shareReplay(1)
    );


  constructor(
    public itemService: ItemService,
    public tagService: TagService,
    public routerHelper: RouterHelperService,
    private userService: UserService,
    private firestore: AngularFirestore,
    private logger: LoggerService
  ) { }

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

  focusOnAddInput(): void {
    const input = document.querySelector('input#addLinkInput') as null | HTMLInputElement;
    if (!input) {
      this.logger.error({
        messageForDev:'input#addLinkInput not found to focus.',
        messageForUser: 'Ops, I can\'t find add link input.',
      });
      return;
    }
    input.focus();
  }
}
