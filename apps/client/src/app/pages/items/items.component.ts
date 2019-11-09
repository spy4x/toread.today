import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { catchError, filter, map, shareReplay, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { Item } from '../../interfaces/item.interface';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, DocumentSnapshot } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { defaultFilter, Filter } from './filter/filter.interface';
import { ItemsService } from '../../services/items/items.service';
import { ItemAddEvent } from '../../common-components/items-add/items-add.component';
import { ActivatedRoute, Params } from '@angular/router';
import { ROUTER_CONSTANTS } from '../../helpers/router.constants';
import { defaultPagination, Pagination } from './pagination.interface';
import { RouterHelperService } from '../../services/routerHelper.service';

const LOAD_ITEMS_LIMIT = 20;

@Component({
  selector: 'tt-items',
  templateUrl: './items.component.pug',
  styleUrls: ['./items.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit, OnDestroy {
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

  filter$ = new BehaviorSubject<Filter>(defaultFilter);
  pagination$ = new BehaviorSubject<Pagination>(defaultPagination);
  items$ = new BehaviorSubject<Item[]>(null);
  reloadItems$ = new BehaviorSubject<void>(void 0);
  existingItem$: Observable<null | Item> = of(null);

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              public itemsService: ItemsService,
              private route: ActivatedRoute,
              public routerHelper: RouterHelperService,
              private cd: ChangeDetectorRef) { }


  ngOnInit(): void {
    this.route.queryParams.pipe<Params>(takeUntil(this.componentDestroy$)).subscribe(params => {
      const tagId = params[ROUTER_CONSTANTS.items.params.tagId];
      const status = params[ROUTER_CONSTANTS.items.params.status];
      const isFavourite = params[ROUTER_CONSTANTS.items.params.isFavourite];

      const filter: Filter = { ...defaultFilter };
      if (tagId) {
        filter.tagId = tagId;
      }
      if (status) {
        filter.status = status;
      }
      if (isFavourite) {
        filter.isFavourite = isFavourite === 'true';
        filter.status = null;
      }
      this.pagination$.next(defaultPagination);
      this.filter$.next(filter);
    });

    this.reloadItems$.pipe(takeUntil(this.componentDestroy$)).subscribe(async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let items$ParamsForLogs: any;
    combineLatest([this.user$, this.filter$, this.reloadItems$],
      (user, filter, reloadItems) => ({ user, filter }))
      .pipe(
        takeUntil(this.componentDestroy$),
        filter(v => !!v.user),
        tap(v => {
          items$ParamsForLogs = v;
          this.pagination$.next({ ...this.pagination$.value, isLoading: true });
        }),
        withLatestFrom(this.pagination$),
        map(([v, pagination]) => ({ ...v, pagination })),
        switchMap(async (v: { user: User, filter: Filter, pagination: Pagination }) => {
          return {
            ...v,
            lastItemSnapshot: v.pagination.lastItemId ? await this.firestore.doc(
              `items/${v.pagination.lastItemId}`).get().toPromise() : null
          };
        }),
        // tap(params => console.log('Loading items with params:', params)),
        switchMap(
          (v: { user: User, filter: Filter, pagination: Pagination, lastItemSnapshot: null | DocumentSnapshot<any> }) => this.firestore
            .collection<Item>('items', ref => {
              let query = ref
                .where('createdBy', '==', v.user.uid)
                .limit(LOAD_ITEMS_LIMIT + 1);
              if (v.filter.status) {
                query = query.where('status', '==', v.filter.status);
                switch (v.filter.status) {
                  case 'new': {
                    query = query.orderBy('createdAt', 'desc');
                    break;
                  }
                  case 'opened': {
                    query = query.orderBy('openedAt', 'desc');
                    break;
                  }
                  case 'finished': {
                    query = query.orderBy('finishedAt', 'desc');
                    break;
                  }
                }
              } else {
                query = query.orderBy('createdAt', 'desc');
              }
              if (v.filter.isFavourite) {
                query = query.where('isFavourite', '==', true);
              }
              if (v.filter.tagId) {
                query = query.where('tags', 'array-contains', v.filter.tagId);
              }
              if (v.lastItemSnapshot && v.lastItemSnapshot.exists) {
                query = query.startAfter(v.lastItemSnapshot);
              }
              return query;
            })
            .valueChanges({ idField: 'id' })
            .pipe(
              takeUntil(this.userIsNotAuthenticated$),
              takeUntil(this.componentDestroy$)
            )
        ),
        tap((items: Item[]) => {
          if (!items.length && this.pagination$.value.page) {
            // if suddenly no items on a page (deleted/changed)
            this.pagination$.next(defaultPagination);
            this.reloadItems$.next(null);
            return;
          }
          this.pagination$.next({
            ...this.pagination$.value,
            isLoading: false,
            nextItemsAvailable: items.length > LOAD_ITEMS_LIMIT
          });
        }),
        map((items: Item[]) => {
          if (items.length > LOAD_ITEMS_LIMIT) {
            items.pop(); // remove last item, for example 21st (we need to show only 20)
          }
          return items;
        }),
        catchError(error => {
          this.error$.next(error.message);
          this.logger.error(
            {
              messageForDev: 'items$ error',
              messageForUser: 'Failed to fetch items.',
              error,
              params: items$ParamsForLogs
            });
          return of(null);
        })
      )
      .subscribe(this.items$);
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  async create(item: ItemAddEvent): Promise<void> {
    const existingItem = await this.itemsService.create({ ...item, title: null });
    if (!existingItem) {
      if (this.filter$.value.status !== 'new') {
        this.routerHelper.toItemsWithFilter({ status: 'new' });
      }
      this.existingItem$ = of(null);
    } else {
      this.existingItem$ = this.itemsService.getById$(existingItem.id);
    }
    this.cd.detectChanges();
  }

  async loadPrev() {
    this.pagination$.next({ ...defaultPagination, nextItemsAvailable: true });
    this.reloadItems$.next(null);
  }

  async loadNext() {
    const items = this.items$.value;
    const lastItemId = items && items.length ? items[items.length - 1].id : null;
    this.pagination$.next({
      ...this.pagination$.value,
      page: this.pagination$.value.page + 1,
      lastItemId: lastItemId
    });
    this.reloadItems$.next(null);
  }
}
