import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {
  catchError,
  filter,
  first,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
  throttleTime
} from 'rxjs/operators';
import { Item } from '../interfaces/item.interface';
import {
  ChangeItemCommentEvent,
  ChangeItemRatingEvent,
  ToggleItemFavouriteEvent,
  ToggleItemTagEvent
} from '../list/list.component';
import { User } from 'firebase';
import { firestore } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../services/logger.service';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { Filter } from '../filter/filter.interface';
import { ItemAddEvent } from '../items-add/items-add.component';
import { ItemsService } from '../services/items/items.service';

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
      this.logger.error('user$ error', error);
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
      this.logger.error('tags$ error', error);
      return of([]);
    }),
    shareReplay(1)
  );

  getNewRandom$ = new BehaviorSubject<void>(null);
  randomItems$ = this.getNewRandom$
    .pipe(
      switchMap(() => this.user$.pipe(first())),
      filter(v => !!v),
      switchMap((user: User ) => this.firestore
        .collection('items', ref => ref.where('createdBy', '==', user.uid).where('__name__', '>=', this.firestore.createId()).where('status', '==', 'new').limit(3))
        .valueChanges({ idField: 'id' })
        .pipe(
          throttleTime(1000), // fixes bug related to that "where('__name__', '>=', v.randomId)" returns 1-2 emits instead of just 1
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )),
      catchError(error => {
        this.error$.next(error.message);
        this.logger.error('randomItems$ error', error);
        return of([]);
      })
    );

  openedItem$ = this.user$.pipe(
      first(),
      filter(v => !!v),
      switchMap((user: User) => this.firestore
        .collection('items', ref => ref.where('createdBy', '==', user.uid).where('status', '==', 'opened').orderBy('openedAt', 'desc').limit(1))
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userIsNotAuthenticated$),
          takeUntil(this.componentDestroy$)
        )),
      catchError(error => {
        this.error$.next(error.message);
        this.logger.error('openedItem$ error', error);
        return of([]);
      })
    );

  filter$ = new BehaviorSubject<Filter>({ tagId: null, status: 'opened', isFavourite: null });
  items$ = new BehaviorSubject<Item[]>(null);
  loadMoreItems$ = new BehaviorSubject<number>(0);
  areAllItemsLoaded: boolean = false;

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              private itemsService: ItemsService) { }

  add(item: ItemAddEvent) {
    // TODO: replace with this.itemsService.add(...)
    this.firestore
      .collection<Item>('items',
        ref => ref.where('url', '==', item.url).where('createdBy', '==', this.userId).limit(1))
      .valueChanges({ idField: 'id' })
      .pipe(
        first(),
        tap(async results => {
          if (!results.length) {
            try {
              const data: Item = this.itemsService.scaffold(item);
              if (this.filter$.value.status !== 'new') {
                this.setFilter({status: 'new'});
              }
              await this.firestore
                .collection('items')
                .add(this.itemsService.getBody(data));
            } catch (error) {
              this.error$.next(error.message);
              this.logger.error('add error', error, { ...item });
            }
          } else {
            this.error$.next('Item already exist. Title: ' + results[0].title);
          }
        })
      ).subscribe();
  }

  async startReading(itemId: string) {
    const data: Partial<Item> = {
      status: 'opened',
      openedAt: new Date()
    };
    try {
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      this.logger.error('startReading() error:', error, { itemId, data, filter: this.filter$.value });
      this.error$.next(error.message);
    }
  }

  async finishReading(itemId: string) {
    const data: Partial<Item> = {
      status: 'finished',
      finishedAt: new Date()
    };
    try {
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      this.logger.error('finishReading() error:', error, { itemId, data });
      this.error$.next(error.message);
    }
  }

  async undoReading(itemId: string) {
    const data: Partial<Item> = {
      status: 'new',
      openedAt: null,
      finishedAt: null
    };
    try {
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      this.logger.error('undoReading() error:', error, { itemId, data });
      this.error$.next(error.message);
    }
  }

  async delete(itemId: string) {
    if (!confirm('Are you sure you want to completely delete this item?')) {
      return;
    }
    try {
      await this.firestore
        .doc('items/' + itemId)
        .delete();
    } catch (error) {
      this.logger.error('delete() error:', error, { itemId });
      this.error$.next(error.message);
    }
  }

  async toggleTag(event: ToggleItemTagEvent) {
    const data = {
      tags: event.isSelected
            ? firestore.FieldValue.arrayUnion(event.id)
            : firestore.FieldValue.arrayRemove(event.id)
    };
    try {
      await this.firestore
        .doc('items/' + event.itemId)
        .update(data);
    } catch (error) {
      this.logger.error('toggleTag() error:', error, { event, data });
      this.error$.next(error.message);
    }
  }

  async toggleFavourite(event: ToggleItemFavouriteEvent) {
    const data: Partial<Item> = {
      isFavourite: event.isFavourite
    };
    try {
      await this.firestore
        .doc('items/' + event.itemId)
        .update(data);
    } catch (error) {
      this.logger.error('toggleFavourite() error:', error, { event, data });
      this.error$.next(error.message);
    }
  }

  async retryURLParsing(itemId: string) {
    const data: Partial<Item> = {
      urlParseError: null,
      urlParseStatus: 'notStarted'
    };
    try {
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      this.logger.error('retryURLParsing() error:', error, { itemId, data });
      this.error$.next(error.message);
    }
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
    this.filter$.next({...this.filter$.value, ...filter});
  }

  async changeRating(event: ChangeItemRatingEvent): Promise<void> {
    const data: Partial<Item> = {
      rating: event.rating
    };
    try {
      await this.firestore
        .doc('items/' + event.id)
        .update(data);
    } catch (error) {
      this.logger.error('changeRating() error:', error, { id: event.id, data });
      this.error$.next(error.message);
    }
  }

  async changeComment(event: ChangeItemCommentEvent): Promise<void> {
    const data: Partial<Item> = {
      comment: event.comment,
      withComment: !!event.comment
    };
    try {
      await this.firestore
        .doc('items/' + event.id)
        .update(data);
    } catch (error) {
      this.logger.error('changeComment() error:', error, { id: event.id, data });
      this.error$.next(error.message);
    }
  }

  ngOnInit(): void {
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
          this.logger.error('items$ error', error, items$Params);
          return of(null);
        })
      )
      .subscribe(this.items$);
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }
}
