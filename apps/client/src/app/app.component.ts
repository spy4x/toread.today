import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import { auth, User } from 'firebase';
import { of } from 'rxjs';
import { catchError, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { unwrapCollectionSnapshotChanges } from '../../../../shared/firestore.helper';
import { Item } from './item.interface';


@Component({
  selector: 'tt-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  user$ = this.angularFireAuth.authState;
  error: string;
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
      return of([]);
    })
  );

  constructor(private angularFireAuth: AngularFireAuth, private firestore: AngularFirestore) {

  }

  signIn() {
    this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  signOut() {
    this.angularFireAuth.auth.signOut();
  }

  addItem(url: string, userId: string) {
    this.error = undefined;
    this.firestore
      .collection('items', ref => ref.where('url', '==', url).where('createdBy', '==', userId).limit(1))
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
                createdBy: userId,
                createdAt: new Date(),
                openedAt: null,
                finishedAt: null
              };
              console.log('saving item:', data);
              const {id, ...body} = data;
              await this.firestore
                .collection('items')
                .add(body);
            } catch (error) {
              this.error = error.message;
            }
          } else {
            this.error = 'Item already exist. Title: ' + results[0].title;
          }
        })
      ).subscribe();
  }

  async startReading(itemId: string) {
    this.startReadingError = undefined;
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
      this.startReadingError = error.message;
    }
  }

  async finishReading(itemId: string) {
    this.finishReadingError = undefined;
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
      this.finishReadingError = error.message;
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
    }
  }

  async delete(itemId: string) {
    try {
      await this.firestore
        .doc('items/' + itemId)
        .delete();
    } catch (error) {
      console.log('delete() error:', error);
    }
  }
}
