import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { catchError, filter, shareReplay, startWith, takeUntil, tap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { LoggerService } from '../../services/logger.service';
import {
  defaultRoadmapBrick,
  RoadmapBrick,
  RoadmapBrickStatus,
  RoadmapBrickType
} from '../../interfaces/roadmapBrick.interface';
import { firestore } from 'firebase/app';
import { AppVersionInfo } from '../../../appVersionInfo.interface';
import {
  RoadmapBrickChangeStatusEvent,
  RoadmapBrickChangeTitleEvent,
  RoadmapBrickChangeTypeEvent
} from './bricks-list/bricks-list.component';
const { appData } = require('../../../../ngsw-config.json');


const collectionPath = 'roadmapBricks';

@Component({
  selector: 'tt-roadmap',
  templateUrl: './roadmap.component.pug',
  styleUrls: ['./roadmap.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadmapComponent implements OnDestroy {
  componentDestroy$ = new Subject<void>();
  userId: null | string;
  user$ = this.auth.authState.pipe(
    takeUntil(this.componentDestroy$),
    tap(user => {
      this.userId = user ? user.uid : null;
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.logger.error({ messageForDev: 'user$ error', error });
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));

  features$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('type','==','feature').orderBy('score', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'features$ error', messageForUser: 'Failed to fetch features.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  suggestions$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('type','==','suggestion').orderBy('score', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'suggestions$ error', messageForUser: 'Failed to fetch suggestions.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  bugs$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('type','==','bug').orderBy('score', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'bugs$ error', messageForUser: 'Failed to fetch bugs.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';
  appVersionInfo = appData as AppVersionInfo;

  @ViewChild('features', {static: true}) featuresElRef: ElementRef;
  @ViewChild('suggestions', {static: true}) suggestionsElRef: ElementRef;
  @ViewChild('bugs', {static: true}) bugsElRef: ElementRef;

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  async vote({brick, rate}:{brick: RoadmapBrick, rate: -1 | 1}): Promise<void> {
    const add = firestore.FieldValue.arrayUnion(this.userId);
    const remove = firestore.FieldValue.arrayRemove(this.userId);
    let scoreDiff: number = rate;
    if (rate > 0) {
      if (brick.likedBy.includes(this.userId)) {
        return;
      }
      if (brick.dislikedBy.includes(this.userId)) {
        scoreDiff = 2;
      }
    } else {
      if (brick.likedBy.includes(this.userId)) {
        scoreDiff = -2;
      }
      if (brick.dislikedBy.includes(this.userId)) {
        return;
      }
    }
    const data = {
      score: firestore.FieldValue.increment(scoreDiff),
      likedBy: rate > 0 ? add : remove,
      dislikedBy: rate > 0 ? remove : add
    };
    try {
      await this.firestore
        .doc(`${collectionPath}/${brick.id}`)
        .update(data);
    } catch (error) {
      this.logger.error(
        {
          messageForDev: 'vote() error:',
          messageForUser: 'Failed to vote for roadmap.',
          error,
          params: { brick, data }
        });
    }
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Are you sure you want to completely delete this suggestion?')) {
      return;
    }
    try {
      await this.firestore
        .doc(`${collectionPath}/${id}`)
        .delete();
    } catch (error) {
      this.logger.error(
        {
          messageForDev: 'remove() error:',
          messageForUser: 'Failed to delete suggestion.',
          error,
          params: { id }
        });
    }
  }

  async add(title: string, type: RoadmapBrickType): Promise<void> {
    const newBrick: RoadmapBrick = {
      ...defaultRoadmapBrick,
      title,
      type,
      createdBy: this.userId,
      createdAt: new Date(),
      score: this.userId === this.antonId ? 0 : 1,
      likedBy: this.userId === this.antonId ? [] : [this.userId]
    };
    try {
      await this.firestore
        .collection(collectionPath)
        .add(newBrick);
    } catch (error) {
      this.logger.error(
        { messageForDev: 'add() error:', messageForUser: 'Failed to add roadmap brick.', error, params: { newBrick } });
    }
  }

  async changeTitle(event: RoadmapBrickChangeTitleEvent): Promise<void> {
    const data = { title: event.title };
    try {
      await this.firestore
        .doc(`${collectionPath}/${event.brick.id}`)
        .update(data);
    } catch (error) {
      this.logger.error(
        {
          messageForDev: 'changeTitle() error:',
          messageForUser: 'Failed to change title of suggestion.',
          error,
          params: { event, data }
        });
    }
  }

  async changeType(event: RoadmapBrickChangeTypeEvent): Promise<void> {
    const data = { type: event.type };
    try {
      await this.firestore
        .doc(`${collectionPath}/${event.brick.id}`)
        .update(data);
    } catch (error) {
      this.logger.error(
        {
          messageForDev: 'changeType() error:',
          messageForUser: 'Failed to change type of roadmap brick.',
          error,
          params: { event, data }
        });
    }
  }

  async changeStatus(event: RoadmapBrickChangeStatusEvent): Promise<void> {
    const status = event.status
    const data: Partial<RoadmapBrick> = { status };
    if (status === 'inProgress' || status === 'done') {
      data.startWorkingAt = new Date();
    }
    if (status === 'done') {
      data.releasedInVersion = prompt(`Enter version name:`, this.appVersionInfo.version);
    }
    try {
      await this.firestore
        .doc(`${collectionPath}/${event.brick.id}`)
        .update(data);
    } catch (error) {
      this.logger.error(
        {
          messageForDev: 'changeStatus() error:',
          messageForUser: 'Failed to change status of roadmap brick.',
          error,
          params: { event, data }
        });
    }
  }

  scrollTo(target: string): void {
    const targetElRef = this[target+'ElRef'] as ElementRef;
    if(!targetElRef || !targetElRef.nativeElement){
      return;
    }
    (targetElRef.nativeElement as HTMLElement).scrollIntoView({behavior: 'smooth'});
  }
}
