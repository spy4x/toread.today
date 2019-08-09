import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import { auth, User } from 'firebase';
import { of } from 'rxjs';
import { catchError, filter, first, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { unwrapCollectionSnapshotChanges } from '../../../../shared/firestore.helper';
import { Item } from './item.interface';
import { ToggleItemTagEvent } from './list/list.component';
import * as firebase from 'firebase/app';


@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
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
  items$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items',
          ref => ref.where('createdBy', '==', user.uid).where('status', '==', 'new').orderBy('createdAt', 'desc').limit(
            5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    catchError(error => {
      this.error = error.message;
      console.error('items$ error', error);
      return of([]);
    })
  );

  inProgressItems$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items',
          ref => ref.where('createdBy', '==', user.uid).where('status', '==', 'opened').orderBy('createdAt',
            'desc').limit(5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    catchError(error => {
      this.error = error.message;
      console.error('inProgressItems$ error', error);
      return of([]);
    })
  );

  inFinishedItems$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items',
          ref => ref.where('createdBy', '==', user.uid).where('status', '==', 'finished').orderBy('createdAt',
            'desc').limit(5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    catchError(error => {
      this.error = error.message;
      console.error('inFinishedItems$ error', error);
      return of([]);
    })
  );

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

  constructor(private angularFireAuth: AngularFireAuth, private firestore: AngularFirestore) {

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
                createdBy: this.userId,
                createdAt: new Date(),
                openedAt: null,
                finishedAt: null
              };
              console.log('saving item:', data);
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
    } catch (error) {
      console.log('startReading() error:', error);
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
      console.log('finishReading() error:', error);
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
      console.log('undoReading() error:', error);
      this.error = error.message;
    }
  }

  async delete(itemId: string) {
    try {
      await this.firestore
        .doc('items/' + itemId)
        .delete();
    } catch (error) {
      console.log('delete() error:', error);
      this.error = error.message;
    }
  }

  async toggleTag(event: ToggleItemTagEvent) {
    try {
      await this.firestore
        .doc('items/' + event.itemId)
        .update({
          tags: event.mode === 'add'
                ? firebase.firestore.FieldValue.arrayUnion(event.id)
                : firebase.firestore.FieldValue.arrayRemove(event.id)
        });
    } catch (error) {
      console.log('toggleTag() error:', error);
      this.error = error.message;
    }
  }
}
