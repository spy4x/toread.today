import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item } from '../../interfaces';
import { ItemService, TagService, RouterHelperService } from '../../../services';
import { first } from 'rxjs/operators';

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
  isSaved = false;

  constructor(
              public itemService: ItemService,
              public tagService: TagService,
              private cd: ChangeDetectorRef,
              private route: ActivatedRoute,
              private routerHelper: RouterHelperService) {
    this.route.queryParams.pipe(first()).subscribe(async params => {
      const url: string = params['url'];
      if (!url) {
        this.routerHelper.toItemsWithFilter({});
        return;
      }
      const itemOrItemId = await this.itemService.create(this.itemService.scaffold({ url }), true);
      let id: string;
      if (typeof itemOrItemId === 'string') {
        id = itemOrItemId;
      } else {
        id = itemOrItemId.id;
      }
      this.isSaved = true;
      this.item$ = this.itemService.getById$(id);
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
