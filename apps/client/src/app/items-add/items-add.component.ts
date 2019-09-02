import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Tag } from '../tag.interface';
import { ToggleTagEvent } from '../list/list.component';

export interface ItemAddEvent {
  urls: string,
  tags: string[],
  isSingle: boolean
}

@Component({
  selector: 'tt-items-add',
  templateUrl: './items-add.component.pug',
  styleUrls: ['./items-add.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsAddComponent {
  @Input() tags: Tag[] = [];
  @Output() addItem = new EventEmitter<ItemAddEvent>();
  isYouTubeCodeVisible = false;
  inputValue = '';
  inputTags: string[] = [];
  isSingleURL = true;
  errors: string[] = [];

  add(): void {
    if(!this.isUrl(this.inputValue)) {
      this.errors = [...this.errors, `${this.inputValue} is not a valid URL`];
      return;
    }
    const item: ItemAddEvent = {
      urls: this.inputValue,
      tags: this.inputTags,
      isSingle: this.isSingleURL
    };
    this.addItem.emit(item);
    this.inputValue = '';
    this.inputTags = [];
  }

  toggleTag(event: ToggleTagEvent) {
    if (event.isSelected) {
      this.inputTags = [...this.inputTags, event.id];
    } else {
      this.inputTags = this.inputTags.filter(tagId => tagId !== event.id);
    }
  }

  isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }

  youTubeCode = `(async () => {
  const totalVideosNumber = +document.querySelector('#stats').children[0].innerHTML.split(' ')[0];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const getURLs = () => Array.from(document.querySelectorAll('ytd-playlist-video-renderer')).map(el => {
    const url = 'https://www.youtube.com' + el.querySelector('a.ytd-playlist-video-renderer').getAttribute('href');
    return url.substr(0, url.indexOf('&list'))
  });
  const scrollUntilAllVideosAreVisible = async (i=0) => {
    if (i>100) { return; } // No more than 10000 videos for now
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
})()`;
}
