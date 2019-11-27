import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item } from '../../interfaces/item.interface';
import { catchError, filter, first, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { User } from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../services/logger.service';
import { ItemsService } from '../../services/items/items.service';
import { RouterHelperService } from '../../services/routerHelper.service';

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
  tags$ = this.userService.firebaseUser$.pipe(
    filter(v => !!v),
    switchMap((user: User) =>
      this.firestore
        .collection('tags',
          ref => ref.where('createdBy', '==', user.uid).orderBy('title'))
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userService.signedOut$),
          takeUntil(this.componentDestroy$),
          catchError(error => {
            this.logger.error({ messageForDev: 'tags$ error', messageForUser: 'Failed to load tags.', error });
            return of([]);
          })
        )
    ),
    shareReplay(1)
  );
  isSaved = false;

  constructor(private userService: UserService,
              private firestore: AngularFirestore,
              public itemsService: ItemsService,
              private cd: ChangeDetectorRef,
              private route: ActivatedRoute,
              private logger: LoggerService,
              private routerHelper: RouterHelperService) {
    this.route.queryParams.pipe(first()).subscribe(async params => {
      const url: string = params['url'];
      if (!url) {
        this.routerHelper.toItemsWithFilter({});
        return;
      }
      const itemOrItemId = await this.itemsService.create(this.itemsService.scaffold({ url }), true);
      let id: string;
      if (typeof itemOrItemId === 'string') {
        id = itemOrItemId;
      } else {
        id = itemOrItemId.id;
      }
      this.isSaved = true;
      this.item$ = this.itemsService.getById$(id);
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
