import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl, Title } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'tt-import-bookmarklet-page',
  templateUrl: './bookmarklet.component.pug',
  styleUrls: ['./bookmarklet.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookmarkletPageComponent implements OnDestroy {
  bookmarkletCode = this.sanitizer.bypassSecurityTrustUrl(this.getBookmarkletCode());
  youTubeCode = this.getYouTubeCode();
  accordion: {[name: string]: boolean} = {};

  constructor(private sanitizer: DomSanitizer, private title: Title) {
    this.preparePageForMakingFavouriteOnMobile();
  }

  ngOnDestroy(): void {
    this.title.setTitle('Toread.Today');
  }

  getBookmarkletCode(): string {
    const s = environment.production ? `https://toread.today` : `http://localhost:4200`;
    return `javascript:location.href='${s}/add?url='+encodeURIComponent(location.href)`;
  }

  preparePageForMakingFavouriteOnMobile(): void {
    const bookmarkletCode = this.getBookmarkletCode();
    // changes current tab URL without refreshing page
    if (!location.href.includes(bookmarkletCode)) {
      window.history.replaceState('', '', `${location.href}#${bookmarkletCode}`);
    }
    this.title.setTitle('Save to Toread.Today');
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

  toggleAccordion(name: string): void {
    this.accordion[name] = !this.accordion[name];
  }

  isAccordionVisible(name: string): boolean {
    return !!this.accordion[name];
  }
}
