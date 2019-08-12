import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, DocumentChangeAction } from 'angularfire2/firestore';
import { User } from 'firebase';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, filter, first, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { unwrapCollectionSnapshotChanges } from '../../../../shared/firestore.helper';
import { Item } from './item.interface';
import { ToggleItemFavouriteEvent, ToggleItemTagEvent } from './list/list.component';
import { auth, firestore } from 'firebase/app';
import { Filter } from './filter/filter.interface';

const LOAD_ITEMS_LIMIT = 20;

@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  error: string;
  userId: null | string;
  user$ = this.angularFireAuth.authState.pipe(
    startWith(JSON.parse(localStorage.getItem('tt-user'))),
    tap(user => {
      this.userId = user ? user.uid : null;
      localStorage.setItem('tt-user', JSON.stringify(user));
    }),
    catchError(error => {
      this.error = error.message;
      console.error('user$ error', error);
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
      console.error('tags$ error', error);
      return of([]);
    }),
    shareReplay(1)
  );

  filter$ = new BehaviorSubject<Filter>({ tagId: null, status: 'opened', isFavourite: null });
  items$ = new BehaviorSubject<Item[]>([]);
  loadMoreItems$ = new BehaviorSubject<number>(0);
  areAllItemsLoaded: boolean = false;
  isLoading: boolean = false;

  constructor(private angularFireAuth: AngularFireAuth, private firestore: AngularFirestore) {}

  ngOnInit() {
    this.filter$.subscribe(() => {
      this.items$.next([]);
      this.areAllItemsLoaded = false;
      this.loadMoreItems$.next(LOAD_ITEMS_LIMIT);
    });
    combineLatest([this.user$, this.filter$, this.loadMoreItems$],
      (user, filter, itemsToLoad) => ({ user, filter, itemsToLoad }))
      .pipe(
        filter(v => !!v.user && !this.areAllItemsLoaded),
        tap(v => this.isLoading = true),
        switchMap((v: { user: User, filter: Filter, itemsToLoad: number }) => this.firestore
          .collection('items',
            ref => {
              let query = ref
                .where('createdBy', '==', v.user.uid)
                .orderBy('createdAt', 'desc')
                .limit(v.itemsToLoad);
              if (v.filter.status) {
                query = query.where('status', '==', v.filter.status)
              }
              if (v.filter.isFavourite) {
                query = query.where('isFavourite', '==', true)
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
          console.error('items$ error', error);
          return of([]);
        })
      )
      .subscribe(this.items$);
  }

  signIn() {
    this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  signOut() {
    this.angularFireAuth.auth.signOut();
  }

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
                imageUrl: null,
                description: null,
                type: null,
                status: 'new',
                tags: [],
                priority: 3,
                isFavourite: false,
                createdBy: this.userId,
                createdAt: new Date(),
                openedAt: null,
                finishedAt: null
              };
              const { id, ...body } = data;
              await this.firestore
                .collection('items')
                .add(body);
            } catch (error) {
              this.error = error.message;
              console.error('addItem error', error);
            }
          } else {
            this.error = 'Item already exist. Title: ' + results[0].title;
          }
        })
      ).subscribe();
  }

  async startReading(itemId: string) {
    try {
      const data: Partial<Item> = {
        status: 'opened',
        openedAt: new Date()
      };
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
      this.filter$.next({ ...this.filter$.value, status: 'opened' });
    } catch (error) {
      console.error('startReading() error:', error);
      this.error = error.message;
    }
  }

  async finishReading(itemId: string) {
    try {
      const data: Partial<Item> = {
        status: 'finished',
        finishedAt: new Date()
      };
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      console.error('finishReading() error:', error);
      this.error = error.message;
    }
  }

  async undoReading(itemId: string) {
    try {
      const data: Partial<Item> = {
        status: 'new',
        openedAt: null,
        finishedAt: null
      };
      await this.firestore
        .doc('items/' + itemId)
        .update(data);
    } catch (error) {
      console.error('undoReading() error:', error);
      this.error = error.message;
    }
  }

  async delete(itemId: string) {
    if(!confirm('Are you sure you want to completely delete this item?')){
      return;
    }
    try {
      await this.firestore
        .doc('items/' + itemId)
        .delete();
    } catch (error) {
      console.error('delete() error:', error);
      this.error = error.message;
    }
  }

  async toggleTag(event: ToggleItemTagEvent) {
    try {
      await this.firestore
        .doc('items/' + event.itemId)
        .update({
          tags: event.isSelected
                ? firestore.FieldValue.arrayUnion(event.id)
                : firestore.FieldValue.arrayRemove(event.id)
        });
    } catch (error) {
      console.error('toggleTag() error:', error);
      this.error = error.message;
    }
  }

  async toggleFavourite(event: ToggleItemFavouriteEvent) {
    try {
      const data: Partial<Item> = {
        isFavourite: event.isFavourite
      };
      await this.firestore
        .doc('items/' + event.itemId)
        .update(data);
    } catch (error) {
      console.error('toggleFavourite() error:', error);
      this.error = error.message;
    }
  }

  async loadMore() {
    if(this.areAllItemsLoaded){
      return;
    }
    const newAmountOfItemsToLoad = this.loadMoreItems$.value + LOAD_ITEMS_LIMIT;
    console.log('Load more items:', newAmountOfItemsToLoad);
    this.loadMoreItems$.next(newAmountOfItemsToLoad);
  }
}
