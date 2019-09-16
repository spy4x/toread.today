import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item, ItemSkeleton } from '../../interfaces/item.interface';
import { Observable, of, throwError } from 'rxjs';
import { setStateProperties } from '../../helpers/state.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';
import { catchError, first, switchMap } from 'rxjs/operators';
import { User } from 'firebase';

@Injectable()
export class ItemsService {
  private apiPath = 'items';
  private apiPathBulk = `${this.apiPath}/bulk`;

  constructor(private http: HttpClient,
              private afa: AngularFireAuth,
              private logger: LoggerService) {}

  scaffold(item: Partial<Item>): Item {
    const defaults: Item = {
      url: null,
      tags: [],
      title: null,
      type: null,
      status: 'new',
      priority: 3,
      isFavourite: false,
      createdBy: this.afa.auth.currentUser.uid,
      createdAt: new Date(),
      openedAt: null,
      finishedAt: null,
      urlParseError: null,
      urlParseStatus: 'notStarted'
    };
    return setStateProperties(defaults, item);
  }

  getBody(item: Item): Item {
    const { id, ...body } = item;
    return body;
  }

  async add(skeleton: ItemSkeleton): Promise<void> {
    const item = this.scaffold(skeleton);
    // TODO: implement and replace usages
  }

  bulkCreate(items: ItemSkeleton[], tags: string[]): Observable<any> {
    return this.afa.authState
      .pipe(
        first(),
        switchMap((user: User) => user.getIdToken()),
        switchMap(token => this.http.post(environment.apiPath + this.apiPathBulk, {
            items,
            tags
          },
          { headers: { authorization: 'Bearer ' + token } })),
        catchError(error => {
          this.logger.error('ItemsService.bulkCreate()', error, { items });
          return throwError(error);
        })
      );
  }
}
