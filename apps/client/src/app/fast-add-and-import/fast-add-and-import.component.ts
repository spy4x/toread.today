import { ChangeDetectionStrategy, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { catchError, filter, first, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../services/logger.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { parseBookmarks, ParseBookmarksResult } from '../bookmarks-parser';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BookmarksBookmark } from '../bookmarks-parser/parser.interface';
import { ItemsService } from '../services/items/items.service';
import { ItemSkeleton } from '../interfaces/item.interface';

type ImportBookmarksState =
  | {} // nothing is happening
  | {isProgress: true}
  | {error: string}
  | {isSuccess: true}

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
  youTubeCode = this.getYouTubeCode();
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
  bookmarksImport$ = new Subject<ParseBookmarksResult>();
  importState$ = new BehaviorSubject<ImportBookmarksState>({});
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
      this.logger.error('tags$ error', error);
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

  saveBookmarks({bookmarks, tags}: {bookmarks: BookmarksBookmark[], tags: string[]}): void {
    const items: ItemSkeleton[] = bookmarks.map(b => ({
      title: b.title,
      tags: b.tags,
      url: b.url
    }));
    this.importState$.next({isProgress: true});
    this.itemsService.bulkCreate(items, tags).pipe(
      first(),
      catchError(error => {
        this.importState$.next({error: error.message});
        return of(null);
      })
    ).subscribe(() =>{
      if((this.importState$.value as {error: string}).error){
        return;
      }
      this.importState$.next({isSuccess: true});
    })
  }

  cancelImportBookmarks(): void {
    this.importState$.next({});
    this.bookmarksImport$.next(null);
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