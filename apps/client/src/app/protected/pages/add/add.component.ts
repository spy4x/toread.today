import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item, ItemPriority, ItemRating } from '../../interfaces';
import { ItemService, RouterHelperService, TagService } from '../../../services';
import { takeUntil } from 'rxjs/operators';
import isURL from 'validator/es/lib/isURL';

@Component({
  selector: 'tt-add',
  templateUrl: './add.component.pug',
  styleUrls: ['./add.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddComponent implements OnDestroy {
  item$: Observable<null | Item> = of(null);
  componentDestroy$ = new Subject<void>();
  isSaving = true;
  error: null | { message: string, type: 'url-invalid' | 'unknown' } = null;
  shouldClose = true;
  url: null | string = null;
  tags: null | string[] = null;
  rating: null | ItemRating = null;
  priority: null | ItemPriority = null;

  constructor(
    public itemService: ItemService,
    public tagService: TagService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private routerHelper: RouterHelperService) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroy$)).subscribe(async params => {
      this.url = params['url'] || params['text'] || params['title']; // "text" and "title" are here because of PWA WebShare API detail - some apps share URL in "text" or "title" fields
      this.tags = params['tags'] ? Array.isArray(params['tags']) ? params['tags'] : [params['tags']] : [];
      this.rating = +params['rating'] as ItemRating;
      this.priority = +params['priority'] as ItemPriority;
      this.shouldClose = (params['close'] !== 'false');
      this.save();
    });
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  goBack() {
    window.history.back();
  }

  async save(): Promise<void> {
    try {
      this.isSaving = true;
      this.error = null;
      const defaultSkeleton = this.itemService.scaffold({});
      this.tags = this.tags || defaultSkeleton.tags;
      this.rating = this.rating || defaultSkeleton.rating;
      this.priority = this.priority || defaultSkeleton.priority;
      if (!this.url) {
        const error = new Error('URL is not valid.');
        (error as any).extraType = 'url-invalid';
        throw error;
      }

      if (!isURL(this.url)) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const results = this.url.match(urlRegex);
        if (results && results.length) {
          this.url = results[0];
        } else {
          const error = new Error('URL is not valid.');
          (error as any).extraType = 'url-invalid';
          throw error;
        }
      }
      const itemId = await this.itemService.create({
        url: this.url,
        tags: this.tags,
        rating: this.rating,
        priority: this.priority,
        title: null
      });
      this.item$ = this.itemService.getById$(itemId);
    } catch (error) {
      this.error = { message: error.message, type: error.extraType || 'unknown' };
    } finally {
      this.isSaving = false;
      this.cd.detectChanges();
    }
  }
}
