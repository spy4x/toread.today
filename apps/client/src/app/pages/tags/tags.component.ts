import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';
import { TagUpdateEvent } from './editor/tags-editor.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { catchError, filter, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';
import { ItemsService } from '../../services/items/items.service';

@Component({
  selector: 'tt-tags',
  templateUrl: './tags.component.pug',
  styleUrls: ['./tags.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent implements OnDestroy {
  componentDestroy$ = new Subject<void>();
  error: string;
  userId: null | string;
  user$ = this.auth.authState.pipe(
    takeUntil(this.componentDestroy$),
    tap(user => {
      this.userId = user ? user.uid : null;
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.error = error.message;
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
      this.error = error.message;
      this.logger.error({ messageForDev: 'tags$ error', error });
      return of([]);
    }),
    shareReplay(1)
  );
  counter$ = this.itemsService.getCounter$();

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              private itemsService: ItemsService) { }

  async create(tag: Tag) {
    tag.createdBy = this.userId;
    try {
      await this.firestore
        .collection('tags')
        .add(tag);
    } catch (error) {
      this.logger.error(
        { messageForDev: 'createTag() error:', messageForUser: 'Failed to save tag.', error, params: { ...tag } });
      this.error = error.message;
    }
  }

  async update(event: TagUpdateEvent) {
    try {
      await this.firestore
        .doc('tags/' + event.id)
        .update(event.change);
    } catch (error) {
      this.logger.error(
        { messageForDev: 'updateTag() error:', messageForUser: 'Failed to update tag.', error, params: { ...event } });
      this.error = error.message;
    }
  }

  async delete(tagId: string) {
    try {
      await this.firestore
        .doc('tags/' + tagId)
        .delete();
    } catch (error) {
      this.logger.error(
        { messageForDev: 'deleteTag() error:', messageForUser: 'Failed to delete tag.', error, params: { tagId } });
      this.error = error.message;
    }
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }
}
