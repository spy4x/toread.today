import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, filter, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Item } from '../../interfaces/item.interface';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { Filter } from './filter/filter.interface';
import { ItemsService } from '../../services/items/items.service';
import { ItemAddEvent } from '../../common-components/items-add/items-add.component';
import { ActivatedRoute, Params } from '@angular/router';
import { ROUTER_CONSTANTS } from '../../helpers/router.constants';

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

  filter$ = new BehaviorSubject<Filter>({ tagId: null, status: 'opened', isFavourite: null });
  items$ = new BehaviorSubject<Item[]>(null);
  loadMoreItems$ = new BehaviorSubject<number>(0);
  areAllItemsLoaded: boolean = false;
  existingItem$ = new BehaviorSubject<null | Item>(null);

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              public itemsService: ItemsService,
              private route: ActivatedRoute) { }


  ngOnInit(): void {
    this.route.queryParams.pipe<Params>(takeUntil(this.componentDestroy$)).subscribe(params => {
      const tagId = params[ROUTER_CONSTANTS.items.params.filterByTag];
      if (tagId) {
        this.setFilter({ tagId });
      }
    });
    this.filter$
      .pipe(
        takeUntil(this.componentDestroy$)
      )
      .subscribe(() => {
        this.areAllItemsLoaded = false;
        this.loadMoreItems$.next(LOAD_ITEMS_LIMIT);
      });

    let items$Params: any;
    combineLatest([this.user$, this.filter$, this.loadMoreItems$],
      (user, filter, itemsToLoad) => ({ user, filter, itemsToLoad }))
      .pipe(
        takeUntil(this.componentDestroy$),
        filter(v => !!v.user && !this.areAllItemsLoaded),
        tap(v => {
          items$Params = v;
        }),
        switchMap((v: { user: User, filter: Filter, itemsToLoad: number }) => this.firestore
          .collection<Item>('items',
            ref => {
              let query = ref
                .where('createdBy', '==', v.user.uid)
                .limit(v.itemsToLoad);
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
              return query;
            })
          .valueChanges({ idField: 'id' })
          .pipe(
            takeUntil(this.userIsNotAuthenticated$),
            takeUntil(this.componentDestroy$)
          )
        ),
        tap((items: Item[]) => {
          this.areAllItemsLoaded = items.length < this.loadMoreItems$.value;
        }),
        catchError(error => {
          this.error$.next(error.message);
          this.logger.error(
            { messageForDev: 'items$ error', messageForUser: 'Failed to fetch items.', error, params: items$Params });
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
        this.setFilter({ status: 'new' });
      }
    }
    this.existingItem$.next(existingItem);
  }

  async loadMore() {
    if (this.areAllItemsLoaded) {
      return;
    }
    const newAmountOfItemsToLoad = this.loadMoreItems$.value + LOAD_ITEMS_LIMIT;
    this.logger.debug('Load more items:', { newAmountOfItemsToLoad });
    this.loadMoreItems$.next(newAmountOfItemsToLoad);
  }

  setFilter(filter: Partial<Filter>): void {
    this.filter$.next({ ...this.filter$.value, ...filter });
  }
}
