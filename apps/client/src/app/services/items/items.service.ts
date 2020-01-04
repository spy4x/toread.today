import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable, of, throwError } from 'rxjs';
import { catchError, first, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { firestore } from 'firebase/app';
import { LoggerService } from '../logger.service';
import { UserService } from '../user.service';
import { BatchSwarm, setStateProperties } from '../../protected/helpers';
import { Item, ItemPriority, ItemRating, ItemsCounter, ItemSkeleton, Tag, User } from '../../protected/interfaces';

export interface RequestParams {
  filter: { [field: string]: any },
  pagination: {
    limit: number,
    page: number,
  },
  sort: { field: string, direction: 'asc' | 'desc' }[]
}

export interface ResponseMeta {
  page: number,
  isLoading: boolean;
  error: null | Error;
  nextItemsAvailable: boolean
}

interface RequestObject<T> {
  response$: Observable<T>;
  responseMeta$: Observable<ResponseMeta>;
  params$: BehaviorSubject<RequestParams>;
}

@Injectable()
export class ItemService {
  constructor(private firestore: AngularFirestore,
              private userService: UserService,
              private logger: LoggerService) { }

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
      createdBy: this.userService.user.id,
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
   */
  create(skeleton: ItemSkeleton): Promise<string> {
    const itemToCreate = this.scaffold(skeleton);
    return this.firestore
      .collection<Item>('items',
        ref => ref.where('url', '==', itemToCreate.url).where('createdBy', '==', this.userService.user.id).limit(1))
      .valueChanges({ idField: 'id' })
      .pipe(
        first(),
        map(results => {
          if (results.length) {
            const itemExisting = results[0] as Item;
            const defaultSkeleton = this.scaffold({});
            const diff: Partial<Item> = {};
            if (itemToCreate.rating !== itemExisting.rating && itemToCreate.rating !== defaultSkeleton.rating) {
              diff.rating = itemToCreate.rating;
              diff.finishedAt = new Date();
              diff.status = 'finished';
            }
            if (itemToCreate.priority !== itemExisting.priority && itemToCreate.priority !== defaultSkeleton.priority) {
              diff.priority = itemToCreate.priority;
            }
            itemToCreate.tags.forEach(newTag => {
              if (!itemExisting.tags.includes(newTag)) {
                diff.tags = diff.tags ? [...diff.tags, newTag] : [newTag];
              }
            });
            if (JSON.stringify(diff) !== JSON.stringify({})) {
              const data: any = {
                ...diff
              };
              if (diff.tags) {
                data.tags = firestore.FieldValue.arrayUnion(...diff.tags);
              }
              this.firestore
                .doc(`items/${itemExisting.id}`)
                .update(data)
                .catch(error => {
                  this.logger.error({
                    messageForDev: 'Failed to update existing item during saving link.',
                    messageForUser: 'Failed to update existing item during saving link.',
                    error,
                    params: { ...itemToCreate }
                  });
                });
            }
            return itemExisting.id;
          }

          if (itemToCreate.rating !== 0) {
            itemToCreate.finishedAt = new Date();
            itemToCreate.status = 'finished';
          }
          const id = this.firestore.createId();
          const promise = this.firestore
            .collection('items')
            .doc(id)
            .set(this.getBodyWithoutId(itemToCreate));
          promise.catch(error => {
            this.logger.error({
              messageForDev: 'Failed to save new link to database.',
              messageForUser: 'Failed to save new link to database.',
              error,
              params: { ...itemToCreate }
            });
          });
          return id;
        }),
        catchError(error => {
          this.logger.error({
            messageForDev: 'add():',
            messageForUser: 'Failed to save new item to database.',
            error,
            params: { ...itemToCreate }
          });
          return throwError(error);
        })
      )
      .toPromise();
  }

  async bulkCreate(items: ItemSkeleton[]): Promise<boolean> {
    try {
      const user = this.userService.user;
      const userId = user.id;
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
        messageForDev: 'ItemService.bulkCreate(): ',
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

  getRequest(initialParams: RequestParams, takeUntil$: Observable<void>): RequestObject<Item[]> {
    let data: Item[] = [];
    let queryCache: firestore.Query;
    const responseMetaSubject = new BehaviorSubject<ResponseMeta>({
      page: initialParams.pagination.page,
      error: null,
      isLoading: false,
      nextItemsAvailable: false
    });
    const params$ = new BehaviorSubject<RequestParams>(initialParams);
    const response$: Observable<Item[]> = combineLatest(
      params$,
      this.userService.authorizedUserOnly$,
      (params, user) => ({ params, user })
    )
      .pipe(
        tap((v: { params: RequestParams, user: User }) => {
          if(!v.params.sort.length){
            this.logger.error({
              messageForDev: 'getRequest() error',
              error: new Error('No sort options were provided. Pagination cannot work without sorting.'),
              params: { ...v.params }
            });
          }
          responseMetaSubject.next({
            ...responseMetaSubject.value,
            isLoading: true,
            error: null
          });
        }),
        switchMap(({ params, user }: { params: RequestParams, user: User }) => this.firestore
          .collection<Item>('items',
            ref => {
              // Basic query
              const limit = params.pagination.limit;
              let query = ref.where('createdBy', '==', user.id).limit(limit);

              // Filters
              if (params.filter.status) {
                query = query.where('status', '==', params.filter.status);
              }
              if (params.filter.isFavourite) {
                query = query.where('isFavourite', '==', true);
              }
              if (typeof params.filter.priority === 'number') { // check for null|undefined to make sure priority === 0 works fine
                query = query.where('priority', '==', params.filter.priority);
                params.sort = params.sort.filter(s => s.field !== 'priority');
              }
              if (params.filter.tagId) {
                query = query.where('tags', 'array-contains', params.filter.tagId);
              }

              // Sorting
              params.sort.forEach(s => {
                query = query.orderBy(s.field, s.direction);
              });

              // Pagination
              if (params.pagination.page && data.length && params.sort.length) {
                query = query.startAfter(...this.getValuesForStartAfter(params, data));
              }

              queryCache = query;
              return query;
            }
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            tap(async v => data = v),
            tap((items: Item[]) => {
              if (!items.length && params.pagination.page) {
                // if suddenly no items on a page (deleted/changed)
                params$.next({
                  ...params,
                  pagination: {
                    ...params.pagination,
                    page: 0
                  }
                });
                return;
              }
            }),
            takeUntil(this.userService.signedOut$),
            takeUntil(takeUntil$),
            catchError(error => {
              this.logger.error({
                messageForDev: 'getRequest() firestore error',
                messageForUser: 'Failed to fetch links.',
                error,
                params: { params, user }
              });
              responseMetaSubject.next({
                ...responseMetaSubject.value,
                error
              });
              return of([] as Item[]);
            }),
            tap(async args => {
              const nextItemsAvailable = data.length ? await this.firestore
                .collection<Item>('items', () => {
                  let query = queryCache.limit(1);
                  query = query.startAfter(...this.getValuesForStartAfter(params, data));
                  return query;
                })
                .valueChanges()
                .pipe(
                  first(),
                  catchError(error => {
                    this.logger.error({
                      messageForDev: 'getRequest() error',
                      messageForUser: 'Failed to fetch next page of links.',
                      error: new Error(error),
                      params: { params, user }
                    });
                    return of([] as Item[]);
                  }),
                  map(v => !!v.length)
                )
                .toPromise() : false;
              responseMetaSubject.next({
                ...responseMetaSubject.value,
                page: params.pagination.page,
                isLoading: false,
                nextItemsAvailable,
              });
            })
          )
        ),
        catchError(error => {
          this.logger.error({
            messageForDev: 'getRequest() stream error',
            messageForUser: 'Failed to fetch links.',
            error: new Error(error),
            params: { params: params$.value, user: this.userService.user }
          });
          responseMetaSubject.next({
            ...responseMetaSubject.value,
            error
          });
          return of([] as Item[]);
        }),
      );

    return {
      response$,
      responseMeta$: responseMetaSubject.asObservable(),
      params$
    };
  }

  getCounter$(): Observable<null | ItemsCounter> {
    return this.firestore
      .doc<ItemsCounter>(`counterItems/${this.userService.user.id}`)
      .valueChanges()
      .pipe(
        map((counter: ItemsCounter) => {
          if (counter) {
            return { ...counter, id: this.userService.user.id };
          } else {
            return null;
          }
        }),
        catchError(error => {
          console.error(`getCounter$ for userId:`, this.userService.user.id, error);
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
        { messageForDev: 'ItemService.remove():', messageForUser: 'Failed to delete item.', error, params: { id } });
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
      } catch { }
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
          messageForDev: 'ItemService.update(): "data" or "data.id" is not provided',
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
        messageForDev: 'ItemService.update():',
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

  private getValuesForStartAfter(params: RequestParams, data: Item[]): any[] {
    return params.sort.map(s => {
      const field = s.field;
      return data[data.length - 1][field];
    });
  }
}
