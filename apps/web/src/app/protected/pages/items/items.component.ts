import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import {
  ItemService,
  LoggerService,
  RequestParams,
  RouterHelperService,
  TagService,
  UIService,
  UserService
} from '../../../services';
import { catchError, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { ItemPriority, NewFinishedMonthlyStatistics, User } from '../../interfaces';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Params } from '@angular/router';
import { ROUTER_CONSTANTS } from '../../helpers';
import { defaultFilter, Filter } from './filter/base/filter.interface';

@Component({
  selector: 'tt-items',
  templateUrl: './items.component.pug',
  styleUrls: ['./items.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit, OnDestroy {
  componentDestroy$ = new Subject<void>();
  itemsRequest = this.itemService.getRequest(
    {
      filter: defaultFilter,
      sort: [
        { field: 'priority', direction: 'desc' },
        { field: 'createdAt', direction: 'desc' }
      ],
      pagination: { limit: 10, page: 0 }
    },
    this.componentDestroy$
  );
  counter$ = this.itemService.getCounter$();

  month$ = new BehaviorSubject<number>(new Date().getMonth() + 1);
  year$ = new BehaviorSubject<number>(new Date().getFullYear());
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  doesNextMonthExist$ = combineLatest(this.year$, this.month$, (year, month) => [year, month]).pipe(
    map(([year, month]: number[]) => {
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      return year < todayYear || (year === todayYear && month < todayMonth);
    })
  );

  // TODO: Move to ItemService
  statistics$: Observable<NewFinishedMonthlyStatistics> = combineLatest(
    [this.userService.userId$, this.month$, this.year$],
    (userId, month, year) => ({ userId, month, year })
  ).pipe(
    switchMap(({ userId, month, year }: { userId: string; month: number; year: number }) => {
      return this.firestore
        .doc<NewFinishedMonthlyStatistics>(`counterNewFinished/${year}_${month}_${userId}`)
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

  OPENED_ITEMS_LIMIT = 3;
  openedItemsRequest = this.itemService.getRequest(
    {
      filter: { status: 'opened' },
      sort: [{ field: 'openedAt', direction: 'desc' }],
      pagination: { limit: this.OPENED_ITEMS_LIMIT, page: 0 }
    },
    this.componentDestroy$
  );

  constructor(
    public firestore: AngularFirestore,
    public userService: UserService,
    public itemService: ItemService,
    public tagService: TagService,
    public routerHelper: RouterHelperService,
    public uiService: UIService,
    private logger: LoggerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe<Params>(takeUntil(this.componentDestroy$)).subscribe(params => {
      const tagId = params[ROUTER_CONSTANTS.items.params.tagId];
      const status = params[ROUTER_CONSTANTS.items.params.status];
      const isFavourite = params[ROUTER_CONSTANTS.items.params.isFavourite];
      const priority = params[ROUTER_CONSTANTS.items.params.priority];

      const filter: Filter = { ...defaultFilter };
      if (tagId) {
        filter.tagId = tagId;
      }
      filter.status = status || filter.status;
      if (isFavourite) {
        filter.isFavourite = isFavourite === 'true';
        filter.status = null;
      }
      if (priority) {
        filter.priority = +priority as ItemPriority;
      }
      this.applyNewParams({
        ...this.itemsRequest.params$.value,
        filter
      });
    });
  }

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
        messageForDev: 'input#addLinkInput not found to focus.',
        messageForUser: "Ops, I can't find add link input."
      });
      return;
    }
    input.focus();
  }

  next(): void {
    const params = this.itemsRequest.params$.value;
    params.pagination.page++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.itemsRequest.params$.next(params);
  }

  prev(): void {
    const params = this.itemsRequest.params$.value;
    params.pagination.page = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.itemsRequest.params$.next(params);
  }

  setPaginationLimit(limit: number): void {
    const params = this.itemsRequest.params$.value;
    params.pagination.limit = limit;
    this.itemsRequest.params$.next(params);
  }

  applyNewParams(params: RequestParams): void {
    switch (params.filter.status) {
      case 'readToday': {
        params.sort = [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' }
        ];
        break;
      }
      case 'opened': {
        params.sort = [{ field: 'openedAt', direction: 'desc' }];
        break;
      }
      case 'finished': {
        params.sort = [{ field: 'finishedAt', direction: 'desc' }];
        break;
      }
      default: {
        params.sort = [{ field: 'createdAt', direction: 'desc' }];
        break;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.itemsRequest.params$.next({
      ...params,
      pagination: {
        ...params.pagination,
        page: 0
      }
    });
  }
}
