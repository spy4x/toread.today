import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';
import { TagUpdateEvent } from '../tags-editor/tags-editor.component';
import { AngularFirestore } from 'angularfire2/firestore';
import { LoggerService } from '../logger.service';
import { catchError, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from 'firebase';
import { unwrapCollectionSnapshotChanges } from '../../../../../shared/firestore.helper';

@Component({
  selector: 'tt-tags',
  templateUrl: './tags.component.pug',
  styleUrls: ['./tags.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent {
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

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  async create(tag: Tag) {
    tag.createdBy = this.userId;
    try {
      await this.firestore
        .collection('tags')
        .add(tag);
    } catch (error) {
      this.logger.error('createTag() error:', error, { ...tag });
      this.error = error.message;
    }
  }

  async update(event: TagUpdateEvent) {
    try {
      await this.firestore
        .doc('tags/' + event.id)
        .update(event.change);
    } catch (error) {
      this.logger.error('updateTag() error:', error, { ...event });
      this.error = error.message;
    }
  }

  async delete(tagId: string) {
    try {
      await this.firestore
        .doc('tags/' + tagId)
        .delete();
    } catch (error) {
      this.logger.error('deleteTag() error:', error, { tagId });
      this.error = error.message;
    }
  }
}
