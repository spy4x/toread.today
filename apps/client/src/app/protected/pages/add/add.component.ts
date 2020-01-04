import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item, ItemPriority, ItemRating } from '../../interfaces';
import { ItemService, RouterHelperService, TagService } from '../../../services';
import { takeUntil } from 'rxjs/operators';

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
  isError = false;
  shouldClose = true;

  constructor(
    public itemService: ItemService,
    public tagService: TagService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private routerHelper: RouterHelperService) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroy$)).subscribe(async params => {
      this.isSaving = true;
      this.isError = false;
      const defaultSkeleton = this.itemService.scaffold({});
      const url: string = params['url'] || params['text'] || params['title']; // "text" and "title" are here because of PWA WebShare API detail - some apps share URL in "text" or "title" fields
      const tags: string[] = params['tags'] ? (Array.isArray(
        params['tags']) ? params['tags'] : [params['tags']]) : defaultSkeleton.tags;
      const rating = +params['rating'] as ItemRating || defaultSkeleton.rating;
      const priority = +params['priority'] as ItemPriority || defaultSkeleton.priority;
      this.shouldClose = (params['close'] !== 'false');
      if (!url) {
        this.routerHelper.toItemsWithFilter({});
        return;
      }
      try {
        const itemId = await this.itemService.create({ url, tags, rating, priority, title: null });
        this.item$ = this.itemService.getById$(itemId);
        this.cd.detectChanges();
      } catch (error) {
        this.isError = true;
      }
      this.isSaving = false;
      this.cd.detectChanges();
    });
  }

  goBack() {
    window.history.back();
  }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }
}
