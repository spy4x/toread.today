import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { catchError, filter, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../../services/logger.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { parseBookmarks, ParseBookmarksResult } from './bookmarks-parser/index';
import { DomSanitizer } from '@angular/platform-browser';
import { ItemsService } from '../../../services/items/items.service';
import { ItemRating, ItemSkeleton } from '../../../interfaces/item.interface';
import { ImportData } from './items-import/items-import.component';

type ImportBookmarksState = null | 'sending' | 'error' | 'success'

@Component({
  selector: 'tt-import-bulk-page',
  templateUrl: './bulk.component.pug',
  styleUrls: ['./bulk.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportBulkPageComponent implements OnDestroy {
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
  bookmarksImport$ = new Subject<ParseBookmarksResult>();
  importState$ = new BehaviorSubject<ImportBookmarksState>(null);

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

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              private sanitizer: DomSanitizer,
              private itemsService: ItemsService) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  parseFile(event): void {
    const [file] = event.target.files;
    const isTxt = file && file.type === 'text/plain';
    const isHtml = file && file.type === 'text/html';
    if (!isHtml && !isTxt) {
      this.error$.next('Please choose Bookmarks file (.html) or Text file (usually .txt)');
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = ev => {
      try {
        this.bookmarksImport$.next(parseBookmarks(ev.target['result'].toString(), isTxt && 'txt'));
      } catch (error) {
        this.error$.next(error.message);
      }
    };
    reader.onerror = ev => {
      console.error(ev);
      this.error$.next('Error while reading file');
    };
  }

  async saveBookmarks({ bookmarks, tags, priority }: ImportData): Promise<void> {
    const items: ItemSkeleton[] = bookmarks.map(b => ({
      title: b.title,
      tags: Array.from(new Set<string>([...b.tags, ...tags])),
      url: b.url,
      rating: 0 as ItemRating,
      priority
    }));
    this.importState$.next('sending');
    const isSuccessful = await this.itemsService.bulkCreate(items);
    this.importState$.next(isSuccessful ? 'success' : 'error');
  }

  cancelImportBookmarks(): void {
    this.importState$.next(null);
    this.bookmarksImport$.next(null);
  }
}
