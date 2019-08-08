import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import { auth, User } from 'firebase';
import { of } from 'rxjs';
import { catchError, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { firestoreQueryStringStartsWith, unwrapCollectionSnapshotChanges } from '../../../../shared/firestore.helper';


@Component({
  selector: 'tt-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  user$ = this.angularFireAuth.authState;
  items$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items', ref => ref.where('createdBy', '==', user.uid).where('status', '==','new').orderBy('createdAt', 'desc').limit(5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    tap(items => console.log('items all:', items)),
    catchError(error => {
      this.loadAllItemsError = error.message;
      return of([]);
    })
  );
  inProgressItems$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items', ref => ref.where('createdBy', '==', user.uid).where('status', '==','inProgress').orderBy('createdAt', 'desc').limit(5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    tap(items => console.log('items in progress:', items)),
    catchError(error => {
      this.loadInProgressItemsError = error.message;
      return of([]);
    })
  );
  inFinishedItems$ = this.user$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('items', ref => ref.where('createdBy', '==', user.uid).where('status', '==','done').orderBy('createdAt', 'desc').limit(5))
        .snapshotChanges()
    ),
    map(unwrapCollectionSnapshotChanges),
    tap(items => console.log('items in done:', items)),
    catchError(error => {
      this.loadinFinishedItemsError = error.message;
      return of([]);
    })
  );
  addItemError: string;
  startReadingError: string;
  finishReadingError: string;
  loadAllItemsError: string;
  loadInProgressItemsError: string;
  loadinFinishedItemsError: string;

  constructor(private angularFireAuth: AngularFireAuth, private firestore: AngularFirestore) {

  }

  signIn() {
    this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  signOut() {
    this.angularFireAuth.auth.signOut();
  }

  addItem(url: string, userId: string) {
    this.addItemError = undefined;
    this.firestore
      .collection('items', ref => ref.where('url', '==', url).where('createdBy', '==', userId).limit(1))
      .snapshotChanges()
      .pipe(
        map(unwrapCollectionSnapshotChanges),
        first(),
        tap(async results => {
          if (!results.length) {
            try {
              const data = {
                url,
                title: null,
                description: null,
                type: 'website',
                status: 'new',
                createdBy: userId,
                createdAt: new Date()
              };
              console.log('saving item:', data);
              await this.firestore
                .collection('items')
                .add(data);
            } catch (error) {
              this.addItemError = error.message;
            }
          } else {
            this.addItemError = 'Item already exist. Title: '+results[0].title;
          }
        })
      ).subscribe();
  }

  async startReading(itemId: string) {
    this.startReadingError = undefined;
    try {
      await this.firestore
        .doc('items/'+itemId)
        .update({
          status: 'inProgress',
        });
    } catch (error) {
      console.log('startReading() error:', error);
      this.startReadingError = error.message;
    }
  }

  async finishReading(itemId: string) {
    this.finishReadingError = undefined;
    try {
      await this.firestore
        .doc('items/'+itemId)
        .update({
          status: 'done',
        });
    } catch (error) {
      console.log('finishReading() error:', error);
      this.finishReadingError = error.message;
    }
  }

  async undoReading(itemId: string) {
    try {
      await this.firestore
        .doc('items/'+itemId)
        .update({
          status: 'new',
        });
    } catch (error) {
      console.log('undoReading() error:', error);
    }
  }
}
