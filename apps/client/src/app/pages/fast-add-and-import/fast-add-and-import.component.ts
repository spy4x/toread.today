import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { catchError, filter, first, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { parseBookmarks, ParseBookmarksResult } from '../../helpers/bookmarks-parser/index';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BookmarksBookmark } from '../../helpers/bookmarks-parser/parser.interface';
import { ItemsService } from '../../services/items/items.service';
import { ItemRating, ItemSkeleton } from '../../interfaces/item.interface';
import { environment } from '../../../environments/environment';
import { ImportData } from './items-import/items-import.component';

type ImportBookmarksState = null | 'sending' | 'error' | 'success'

@Component({
  selector: 'tt-add-and-import',
  templateUrl: './fast-add-and-import.component.pug',
  styleUrls: ['./fast-add-and-import.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FastAddAndImportComponent implements OnDestroy {
  componentDestroy$ = new Subject<void>();
  error$ = new BehaviorSubject<string>(null);
  userId: null | string;
  bookmarkletCode = this.getBookmarkletCode();
  youTubeCode = this.getYouTubeCode();
  user$ = this.auth.authState.pipe(
    takeUntil(this.componentDestroy$),
    tap(user => {
      this.userId = user ? user.uid : null;
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.error$.next(error.message);
      this.logger.error({messageForDev: 'user$ error', error});
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));
  bookmarksImport$ = new Subject<ParseBookmarksResult>();
  importState$ = new BehaviorSubject<ImportBookmarksState>(null);
  isBookmarkletVideoVisible = false;
  isImportVideoVisible = false;

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
      this.logger.error({messageForDev: 'tags$ error', error});
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
        this.bookmarksImport$.next(parseBookmarks(ev.target['result'], isTxt && 'txt'));
      } catch (error) {
        this.error$.next(error.message);
      }
    };
    reader.onerror = ev => {
      console.error(ev);
      this.error$.next('Error while reading file');
    };
  }

  saveBookmarks({bookmarks, tags, priority}: ImportData): void {
    const items: ItemSkeleton[] = bookmarks.map(b => ({
      title: b.title,
      tags: b.tags,
      url: b.url,
      rating: 0 as ItemRating,
    }));
    this.importState$.next('sending');
    this.itemsService.bulkCreate(items, tags, priority).pipe(
      first(),
      catchError(() => {
        this.importState$.next('error');
        return of(null);
      })
    ).subscribe(() =>{
      if (this.importState$.value !== 'error') {
        this.importState$.next('success');
      }
    })
  }

  cancelImportBookmarks(): void {
    this.importState$.next(null);
    this.bookmarksImport$.next(null);
  }

  getBookmarkletCode(): SafeUrl {
    const s = environment.production ? `https://toread-today.web.app` : `http://localhost:4200`;
    return this.sanitizer.bypassSecurityTrustUrl(`javascript:location.href='${s}/items?url='+encodeURIComponent(location.href)`);
  }

  getYouTubeCode(): SafeUrl {
    // TODO: rewrite script to make it load custom script from toread.today domain and run it
    return this.sanitizer.bypassSecurityTrustUrl(`javascript:(async () => {
  const totalVideosNumber = +document.querySelector('#stats').children[0].innerHTML.split(' ')[0];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const getURLs = () => Array.from(document.querySelectorAll('ytd-playlist-video-renderer')).map(el => {
    const url = 'https://www.youtube.com' + el.querySelector('a.ytd-playlist-video-renderer').getAttribute('href');
    return url.substr(0, url.indexOf('&list'));
  });
  const scrollUntilAllVideosAreVisible = async (i=0) => {
    if (i>100) { return; } /* No more than 10000 videos for now */
    if (getURLs().length !== totalVideosNumber) {
      if (!i) { console.log('Scrolling page to load all videos...'); }
      window.scrollTo(0, document.querySelector('ytd-app').scrollHeight);
      await sleep(500);
      await scrollUntilAllVideosAreVisible(++i);
    }
  };
  await scrollUntilAllVideosAreVisible();
  const urls = getURLs();
  console.log('Results:'); console.log(urls.join('\\n')); console.log(\`--- Total urls: \${urls.length} ---\`);
})()`);
  }
}
