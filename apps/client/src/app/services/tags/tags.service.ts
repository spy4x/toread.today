import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, takeUntil, catchError, shareReplay } from 'rxjs/operators';
import { User, Tag } from '../../protected/interfaces';
import { UserService } from '../user.service';
import { LoggerService } from '../logger.service';

@Injectable()
export class TagService {
  private apiPath = 'tags';

  constructor(private firestore: AngularFirestore,
              private userService: UserService,
              private logger: LoggerService) {}

  // scaffold(tag: Partial<Tag>): Tag {
  //   const defaults: Tag = {
  //     url: null,
  //     tags: [],
  //     title: null,
  //     type: null,
  //     status: 'new',
  //     priority: 3,
  //     rating: 0,
  //     comment: '',
  //     withComment: false,
  //     isFavourite: false,
  //     createdBy: this.afa.auth.currentUser.uid,
  //     createdAt: new Date(),
  //     openedAt: null,
  //     finishedAt: null,
  //     urlParseError: null,
  //     urlParseStatus: 'notStarted'
  //   };
  //   return setStateProperties(defaults, tag);
  // }

  // /**
  //  * Returns "null" in case of successful creation, "Tag" in case of Tag exists.
  //  * @param skeleton
  //  */
  // create(skeleton: TagSkeleton): Promise<null | Tag> {
  //   const tag = this.scaffold(skeleton);
  //   return this.afa.authState
  //     .pipe(
  //       take(1),
  //       switchMap((user: User) =>
  //         this.firestore
  //           .collection<Tag>('tags',
  //             ref => ref.where('url', '==', tag.url).where('createdBy', '==', user.uid).limit(1))
  //           .valueChanges({ idField: 'id' })
  //           .pipe(
  //             take(1),
  //             switchMap(async results => {
  //               if (results.length) {
  //                 return results[0];
  //               }
  //               if (tag.rating !== 0) {
  //                 tag.finishedAt = new Date();
  //                 tag.status = 'finished';
  //               }
  //               try {
  //                 await this.firestore
  //                   .collection('tags')
  //                   .add(this.getBodyWithoutId(tag));
  //               } catch (error) {
  //                 this.logger.error({
  //                   messageForDev: 'add():',
  //                   messageForUser: 'Failed to save new tag to database.',
  //                   error,
  //                   params: { ...tag }
  //                 });
  //               }
  //             })
  //           ))
  //     )
  //     .toPromise();
  // }

  // bulkCreate(tags: TagSkeleton[], tags: string[]): Observable<any> {
  //   // TODO: use custom AuthService to get User
  //   return this.afa.authState
  //     .pipe(
  //       take(1),
  //       switchMap((user: User) => user.getIdToken()),
  //       switchMap(token => {
  //         const url = environment.apiPath + this.apiPathBulk;
  //         const body = { tags, tags };
  //         const options = { headers: { authorization: 'Bearer ' + token } };
  //         return this.http.post(url, body, options);
  //       }),
  //       catchError(error => {
  //         this.logger.error({
  //           messageForDev: 'TagService.bulkCreate(): ',
  //           messageForUser: 'Error happened while sending import file to the server. Try again.',
  //           error,
  //           params: { tags }
  //         });
  //         return throwError(error);
  //       })
  //     );
  // }
  //
  // getById$(id: string): Observable<null | Tag> {
  //   return this.firestore
  //     .doc<Tag>(`tags/${id}`)
  //     .valueChanges()
  //     .pipe(
  //       map((tag: Tag) => {
  //         if (tag) {
  //           return { ...tag, id };
  //         } else {
  //           return null;
  //         }
  //       }),
  //       catchError(error => {
  //         console.error(`getById$`, id, error);
  //         return of(null);
  //       })
  //     );
  // }

  // async remove(id: string): Promise<void> {
  //   if (!confirm('Are you sure you want to completely remove this tag?')) {
  //     return;
  //   }
  //   try {
  //     await this.firestore
  //       .doc(this.getPathForId(id))
  //       .delete();
  //   } catch (error) {
  //     this.logger.error(
  //       { messageForDev: 'TagService.remove():', messageForUser: 'Failed to delete tag.', error, params: { id } });
  //   }
  // }

  tags$: Observable<Tag[]> = this.userService.authorizedUserOnly$.pipe(
    switchMap((user: User) =>
      this.firestore
        .collection('tags', ref => ref.where('createdBy', '==', user.id).orderBy('title'))
        .valueChanges({ idField: 'id' })
        .pipe(
          takeUntil(this.userService.signedOut$),
          catchError(error => {
            this.logger.error({ messageForDev: 'tags$ error', messageForUser: 'Failed to load tags.', error });
            return of([]);
          })
        )
    ),
    shareReplay(1)
  );

  merge(tagFrom: Tag, tagTo: Tag): Promise<void> {
    return this.update({ id: tagFrom.id, mergeIntoTagId: tagTo.id }, 'Failed to merge tags.');
  }

  private async update(data: Partial<Tag>, errorMessageForUser?: string): Promise<void> {
    if (!data || !data.id) {
      this.logger.error(
        {
          messageForDev: 'TagService.update(): "data" or "data.id" is not provided',
          messageForUser: errorMessageForUser || 'Failed to update tag.',
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
        messageForDev: 'TagService.update():',
        messageForUser: errorMessageForUser || 'Failed to update tag',
        error,
        params: { data }
      });
    }
  }

  private getBodyWithoutId(tag: Partial<Tag>): Partial<Tag> {
    const { id, ...body } = tag;
    return body;
  }

  private getPathForId(id: string): string {
    return `tags/${id}`;
  }
}
