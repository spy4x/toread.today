import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, filter, first, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { unwrapCollectionSnapshotChanges } from '../../../../../shared/firestore.helper';
import { Item } from '../item.interface';
import { ToggleItemFavouriteEvent, ToggleItemTagEvent } from '../list/list.component';
import { User } from 'firebase';
import { firestore } from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, DocumentChangeAction } from 'angularfire2/firestore';
import { LoggerService } from '../logger.service';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { Filter } from '../filter/filter.interface';

const LOAD_ITEMS_LIMIT = 20;

@Component({
  selector: 'tt-items',
  templateUrl: './items.component.pug',
  styleUrls: ['./items.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit{
  error: string;
  userId: null | string;
  user$ = this.auth.authState.pipe(
    startWith(JSON.parse(localStorage.getItem('tt-user'))),
    tap(user => {
      this.userId = user ? user.uid : null;
      localStorage.setItem('tt-user', JSON.stringify(user));
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.error = error.message;
      this.logger.error('user$ error', error);
      return of(null);
    }));

  tags$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('tags',
          ref => ref.where('createdBy', '==', user.uid).orderBy('title'))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    catchError(error => {
      this.error = error.message;
      this.logger.error('tags$ error', error);
      return of([]);
    }),
    shareReplay(1)
  );

  filter$ = new BehaviorSubject<Filter>({ tagId: null, status: 'opened', isFavourite: null });
  items$ = new BehaviorSubject<Item[]>([]);
  loadMoreItems$ = new BehaviorSubject<number>(0);
  areAllItemsLoaded: boolean = false;
  isLoading: boolean = false;

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  addItem(url: string) {
    this.firestore
      .collection('items', ref => ref.where('url', '==', url).where('createdBy', '==', this.userId).limit(1))
      .snapshotChanges()
      .pipe(
        map(unwrapCollectionSnapshotChanges),
        first(),
        tap(async results => {
          if (!results.length) {
            try {
              const data: Item = {
                id: null,
                url,
                title: null,
                type: null,
                status: 'new',
                tags: [],
                priority: 3,
                isFavourite: false,
                createdBy: this.userId,
                createdAt: new Date(),
                openedAt: null,
                finishedAt: null,
                urlParseError: null,
                urlParseStatus: 'notStarted'
              };
              const { id, ...body } = data;
              this.filter$.next({ ...this.filter$.value, status: 'new' });
              await this.firestore
                .collection('items')
                .add(body);
            } catch (error) {
              this.error = error.message;
              this.logger.error('addItem error', error, {url});
            }
          } else {
            this.error = 'Item already exist. Title: ' + results[0].title;
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
      this.logger.error('startReading() error:', error, {itemId, data, filter: this.filter$.value});
      this.error = error.message;
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
      this.logger.error('finishReading() error:', error, {itemId, data});
      this.error = error.message;
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
      this.logger.error('undoReading() error:', error, {itemId, data});
      this.error = error.message;
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
      this.logger.error('delete() error:', error, {itemId});
      this.error = error.message;
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
      this.logger.error('toggleTag() error:', error, {event, data});
      this.error = error.message;
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
      this.logger.error('toggleFavourite() error:', error, {event, data});
      this.error = error.message;
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
      this.logger.error('retryURLParsing() error:', error, {itemId, data});
      this.error = error.message;
    }
  }

  async loadMore() {
    if (this.areAllItemsLoaded) {
      return;
    }
    const newAmountOfItemsToLoad = this.loadMoreItems$.value + LOAD_ITEMS_LIMIT;
    this.logger.debug('Load more items:', {newAmountOfItemsToLoad});
    this.loadMoreItems$.next(newAmountOfItemsToLoad);
  }

  ngOnInit(): void {
    this.filter$.subscribe(() => {
      this.items$.next([]);
      this.areAllItemsLoaded = false;
      this.loadMoreItems$.next(LOAD_ITEMS_LIMIT);
    });

    let items$Params: any;
    combineLatest([this.user$, this.filter$, this.loadMoreItems$],
      (user, filter, itemsToLoad) => ({ user, filter, itemsToLoad }))
      .pipe(
        filter(v => !!v.user && !this.areAllItemsLoaded),
        tap(v => {
          this.isLoading = true;
          items$Params = v;
        }),
        switchMap((v: { user: User, filter: Filter, itemsToLoad: number }) => this.firestore
          .collection('items',
            ref => {
              let query = ref
                .where('createdBy', '==', v.user.uid)
                .limit(v.itemsToLoad);
              if (v.filter.status) {
                query = query.where('status', '==', v.filter.status);
                switch(v.filter.status){
                  case 'new': {
                    query = query.orderBy('createdAt', 'desc')
                    break;
                  }
                  case 'opened': {
                    query = query.orderBy('openedAt', 'desc')
                    break;
                  }
                  case 'finished': {
                    query = query.orderBy('finishedAt', 'desc')
                    break;
                  }
                }
              } else {
                query = query.orderBy('createdAt', 'desc')
              }
              if (v.filter.isFavourite) {
                query = query.where('isFavourite', '==', true);
              }
              if (v.filter.tagId) {
                query = query.where('tags', 'array-contains', v.filter.tagId);
              }
              return query;
            })
          .snapshotChanges()
        ),
        tap((documentChangeAction: DocumentChangeAction<Item>[]) => {
          this.isLoading = false;
          this.areAllItemsLoaded = documentChangeAction.length < this.loadMoreItems$.value;
        }),
        map(unwrapCollectionSnapshotChanges),
        catchError(error => {
          this.isLoading = false;
          this.error = error.message;
          this.logger.error('items$ error', error, items$Params);
          return of([]);
        })
      )
      .subscribe(this.items$);
  }
}
