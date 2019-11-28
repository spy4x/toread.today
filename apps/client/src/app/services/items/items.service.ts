import { Injectable } from '@angular/core';
import { Item, ItemPriority, ItemRating, ItemSkeleton } from '../../interfaces/item.interface';
import { Observable, of } from 'rxjs';
import { setStateProperties } from '../../helpers/state.helper';
import { AngularFireAuth } from '@angular/fire/auth';
import { LoggerService } from '../logger.service';
import { catchError, first, map, switchMap } from 'rxjs/operators';
import { firestore, User } from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { BatchSwarm } from '../../helpers/batchSwarm.helper';
import { Tag } from '../../interfaces/tag.interface';
import { ItemsCounter } from '../../interfaces/itemsCounter.interface';

@Injectable()
export class ItemsService {
  constructor(private firestore: AngularFirestore,
              private afa: AngularFireAuth,
              private logger: LoggerService) {}

  scaffold(item: Partial<Item>): Item {
    const defaults: Item = {
      url: null,
      tags: [],
      title: null,
      type: null,
      status: 'new',
      priority: 0,
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

  /**
   * Returns "null" in case of successful creation, "Item" in case of Item exists.
   * @param skeleton
   * @param shouldReturnCreatedItemId or null
   */
  create(skeleton: ItemSkeleton, shouldReturnCreatedItemId?: boolean): Promise<null | string | Item> {
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
                if (item.rating !== 0) {
                  item.finishedAt = new Date();
                  item.status = 'finished';
                }
                try {
                  const docRef = await this.firestore
                    .collection('items')
                    .add(this.getBodyWithoutId(item));
                  if (!shouldReturnCreatedItemId) {
                    return null;
                  }
                  return docRef.id;
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

  async bulkCreate(items: ItemSkeleton[]): Promise<boolean> {
    // TODO: use custom AuthService to get User
    try {
      const user = await this.afa.authState.pipe(first()).toPromise();
      const userId = user.uid;
      const tagsCache = new Map<string, string>();
      const initialValue: string[] = [];
      const reducer = (acc: string[], cur: ItemSkeleton) => {
        acc.push(...cur.tags);
        return acc;
      };
      const tagsFromItems: string[] = items.reduce(reducer, initialValue);
      const allTagTitlesOrTagIds = Array.from(new Set(tagsFromItems));
      await Promise.all(
        allTagTitlesOrTagIds.map(tagTitleOrId => this.getTagIdOrCreate(tagTitleOrId, userId, tagsCache)));

      const batch = new BatchSwarm(this.firestore.firestore);
      items.forEach(item => {
        item.tags = item.tags.map(tagTitleOrId => tagsCache.get(tagTitleOrId));
        batch.set(this.firestore.doc(`items/${this.firestore.createId()}`).ref, this.scaffold(item));
      });
      await batch.commit();
      return true;
    } catch (error) {
      this.logger.error({
        messageForDev: 'ItemsService.bulkCreate(): ',
        messageForUser: 'Error happened while importing. Developer is notified. Please try again later.',
        error,
        params: { items }
      });
      return false;
    }
  }

  getById$(id: string): Observable<null | Item> {
    return this.firestore
      .doc<Item>(`items/${id}`)
      .valueChanges()
      .pipe(
        map((item: Item) => {
          if (item) {
            return { ...item, id };
          } else {
            return null;
          }
        }),
        catchError(error => {
          console.error(`getById$`, id, error);
          return of(null);
        })
      );
  }

  getCounter$(): Observable<null | ItemsCounter> {
    return this.firestore
      .doc<ItemsCounter>(`counterItems/${this.afa.auth.currentUser.uid}`)
      .valueChanges()
      .pipe(
        map((counter: ItemsCounter) => {
          if (counter) {
            return { ...counter, id: this.afa.auth.currentUser.uid };
          } else {
            return null;
          }
        }),
        catchError(error => {
          console.error(`getCounter$ for userId:`, this.afa.auth.currentUser.uid, error);
          return of(null);
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

  setPriority(id: string, priority: ItemPriority): Promise<void> {
    return this.update({ id, priority }, 'Failed to set item priority.');
  }

  setTitle(id: string, title: string): Promise<void> {
    return this.update({ id, title }, 'Failed to set item title.');
  }

  setURL(id: string, url: string): Promise<void> {
    return this.update({ id, url, title: null, urlParseError: null, urlParseStatus: 'notStarted' }, 'Failed to set' +
      ' item URL.');
  }

  /**
   * Creates missing tags
   * @param tagIdOrTitle tag id and new tag title. New tag will be created from tag title.
   * @param userId
   * @param cache Map of <tagIdOrTitle, tagId> to avoid massive calls to DB
   * @returns array of tags ids
   */
  async getTagIdOrCreate(tagIdOrTitle: string, userId: string, cache: Map<string, string>): Promise<string> {
    const tagId = cache.get(tagIdOrTitle);
    if (tagId) {
      return tagId;
    }

    if (tagIdOrTitle.length === 20) { // length of Firestore document autogenerated ID
      let doc;
      try {
        doc = await this.firestore.doc(`tags/${tagIdOrTitle}`).ref.get();
      } catch {}
      if (doc && doc.exists && doc.data().createdBy === userId) {
        cache.set(tagIdOrTitle, doc.id);
        return doc.id;
      }
    }

    const snapshot = await this.firestore.firestore
      .collection(`tags`)
      .where('title', '==', tagIdOrTitle)
      .where('createdBy', '==', userId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      cache.set(tagIdOrTitle, snapshot.docs[0].id);
      return snapshot.docs[0].id;
    }

    // TODO: replace with factory function or service
    const newTag: Tag = {
      title: tagIdOrTitle,
      color: '#209cee',
      mergeIntoTagId: null,
      createdBy: userId,
      createdAt: new Date()
    };
    const doc = await this.firestore.collection(`tags`).add(newTag);
    cache.set(tagIdOrTitle, doc.id);
    return doc.id;
  }

  private async update(data: Partial<Item>, errorMessageForUser?: string): Promise<void> {
    if (!data || !data.id) {
      this.logger.error(
        {
          messageForDev: 'ItemsService.update(): "data" or "data.id" is not provided',
          messageForUser: errorMessageForUser || 'Failed to' +
            ' update item.',
          params: { data }
        });
      return;
    }
    const body = this.getBodyWithoutId(data);
    try {
      await this.firestore
        .doc(this.getPathForId(data.id))
        .update(body);
    } catch (error) {
      this.logger.error({
        messageForDev: 'ItemsService.update():',
        messageForUser: errorMessageForUser || 'Failed to update item',
        error,
        params: { data }
      });
    }
  }

  private getBodyWithoutId(item: Partial<Item>): Partial<Item> {
    const { id, ...body } = item;
    return body;
  }

  private getPathForId(id: string): string {
    return `items/${id}`;
  }
}
