import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item, ItemRating, ItemSkeleton } from '../../interfaces/item.interface';
import { Observable, throwError } from 'rxjs';
import { setStateProperties } from '../../helpers/state.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';
import { catchError, first, switchMap } from 'rxjs/operators';
import { firestore, User } from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class ItemsService {
  private apiPath = 'items';
  private apiPathBulk = `${this.apiPath}/bulk`;

  constructor(private http: HttpClient,
              private firestore: AngularFirestore,
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
      rating: 0,
      comment: '',
      withComment: false,
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

  getBody(item: Partial<Item>): Partial<Item> {
    const { id, ...body } = item;
    return body;
  }

  /**
   * Returns "null" in case of successful creation, "Item" in case of Item exists.
   * @param skeleton
   */
  create(skeleton: ItemSkeleton): Promise<null | Item> {
    const item = this.scaffold(skeleton);
    return this.afa.authState
      .pipe(
        first(),
        switchMap((user: User) =>
          this.firestore
            .collection<Item>('items',
              ref => ref.where('url', '==', item.url).where('createdBy', '==', user.uid).limit(1))
            .valueChanges({ idField: 'id' })
            .pipe(
              first(),
              switchMap(async results => {
                if (results.length) {
                  return results[0];
                }
                if(item.rating !== 0){
                  item.finishedAt = new Date();
                  item.status = 'finished';
                }
                try {
                  await this.firestore
                    .collection('items')
                    .add(this.getBody(item));
                } catch (error) {
                  this.logger.error({
                    messageForDev: 'add():',
                    messageForUser: 'Failed to save new item to database.',
                    error,
                    params: { ...item }
                  });
                }
              })
            ))
      )
      .toPromise();
  }

  bulkCreate(items: ItemSkeleton[], tags: string[]): Observable<any> {
    // TODO: use custom AuthService to get User
    return this.afa.authState
      .pipe(
        first(),
        switchMap((user: User) => user.getIdToken()),
        switchMap(token => {
          const url = environment.apiPath + this.apiPathBulk;
          const body = { items, tags };
          const options = { headers: { authorization: 'Bearer ' + token } };
          return this.http.post(url, body, options);
        }),
        catchError(error => {
          this.logger.error({
            messageForDev: 'ItemsService.bulkCreate(): ',
            messageForUser: 'Error happened while sending import file to the server. Try again.',
            error,
            params: { items }
          });
          return throwError(error);
        })
      );
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Are you sure you want to completely remove this item?')) {
      return;
    }
    try {
      await this.firestore
        .doc(this.getPathForId(id))
        .delete();
    } catch (error) {
      this.logger.error(
        { messageForDev: 'ItemsService.remove():', messageForUser: 'Failed to delete item.', error, params: { id } });
    }
  }

  startReading(id: string): Promise<void> {
    return this.update({ id, status: 'opened', openedAt: new Date() }, 'Failed to mark item as opened.');
  }

  finishReading(id: string): Promise<void> {
    return this.update({ id, status: 'finished', finishedAt: new Date() }, 'Failed to mark item as finished.');
  }

  markAsNew(id: string): Promise<void> {
    return this.update({ id, status: 'new', openedAt: null, finishedAt: null }, 'Failed to mark item as new.');
  }

  toggleTag(id: string, isSelected: boolean, tagId: string): Promise<void> {
    return this.update({
      id,
      tags: (isSelected
            ? firestore.FieldValue.arrayUnion(tagId)
            : firestore.FieldValue.arrayRemove(tagId)) as unknown as string[]
    }, 'Failed to toggle item tag.');
  }

  toggleFavourite(id: string, isFavourite: boolean): Promise<void> {
    return this.update({ id, isFavourite }, 'Failed to toggle item favourite status.');
  }

  retryURLParsing(id: string): Promise<void> {
    return this.update({ id, urlParseError: null, urlParseStatus: 'notStarted' }, 'Failed to send request about' +
      ' "Retry URL parsing" for item.');
  }

  changeRating(id: string, rating: ItemRating): Promise<void> {
    return this.update({ id, rating }, 'Failed to change item rating.');
  }

  changeComment(id: string, comment: string): Promise<void> {
    return this.update({ id, comment, withComment: !!comment }, 'Failed to change item comment.');
  }

  private async update(item: Partial<Item>, errorMessageForUser?: string): Promise<void> {
    if (!item || !item.id) {
      this.logger.error(
        { messageForDev: 'ItemsService.update(): "item" or "item.id" is not provided', messageForUser: errorMessageForUser || 'Failed to' +
            ' update item', params: { item } });
      return;
    }
    const id = item.id;
    const body = this.getBody(item);
    try {
      await this.firestore
        .doc(this.getPathForId(id))
        .update(body);
    } catch (error) {
      this.logger.error({
        messageForDev: 'ItemsService.update():', messageForUser: errorMessageForUser || 'Failed to' +
          ' update item', error, params: { id, body, item }
      });
    }
  }

  private getPathForId(id: string): string {
    return `items/${id}`;
  }
}
