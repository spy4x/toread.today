import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { catchError, filter, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { LoggerService } from '../../services/logger.service';
import {
  defaultRoadmapBrick,
  RoadmapBrick,
  RoadmapBrickType
} from '../../interfaces/roadmapBrick.interface';
import { firestore } from 'firebase/app';
import { AppVersionInfo } from '../../../appVersionInfo.interface';
import {
  RoadmapBrickChangeStatusEvent,
  RoadmapBrickChangeTitleEvent,
  RoadmapBrickChangeTypeEvent
} from './bricks-list/bricks-list.component';
import { UserService } from '../../services/user.service';
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

  bricksNew$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('status','==','new').orderBy('type').orderBy('score', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'features$ error', messageForUser: 'Failed to fetch new roadmap bricks.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  bricksInProgress$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('status','==','inProgress').orderBy('startWorkingAt', 'asc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'suggestions$ error', messageForUser: 'Failed to fetch roadmap bricks in progress.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  bricksDone$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.where('status','==','done').orderBy('releasedAt', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'bugs$ error', messageForUser: 'Failed to fetch done roadmap bricks', error });
        return of([]);
      }),
      shareReplay(1)
    );
  antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';
  appVersionInfo = appData as AppVersionInfo;

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService,
              public userService: UserService) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  async vote({ brick, rate }: { brick: RoadmapBrick, rate: -1 | 1 }): Promise<void> {
    let scoreDiff: number = rate;
    let likedBy: firestore.FieldValue;
    let dislikedBy: firestore.FieldValue;
    const add = firestore.FieldValue.arrayUnion(this.userId);
    const remove = firestore.FieldValue.arrayRemove(this.userId);
    if (rate > 0) {
      if (brick.likedBy.includes(this.userId)) {
        // double click on already voted button means - remove my vote
        scoreDiff = -1;
        likedBy = remove;
        dislikedBy = remove;
      } else {
        likedBy = add;
        dislikedBy = remove;
        if (brick.dislikedBy.includes(this.userId)) {
          scoreDiff = 2;
        }
      }
    } else {
      if (brick.dislikedBy.includes(this.userId)) {
        // double click on already voted button means - remove my vote
        scoreDiff = 1;
        likedBy = remove;
        dislikedBy = remove;
      }else{
        likedBy = remove;
        dislikedBy = add;
        if (brick.likedBy.includes(this.userId)) {
          scoreDiff = -2;
        }
      }
    }
    const data = {
      score: firestore.FieldValue.increment(scoreDiff),
      likedBy,
      dislikedBy
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
    const status = event.status;
    const data: Partial<RoadmapBrick> = { status };
    if (status === 'new') {
      data.startWorkingAt = null;
      data.releasedAt = null;
      data.releasedInVersion = null;
    }
    if (status === 'inProgress') {
      data.startWorkingAt = new Date();
      data.releasedAt = null;
      data.releasedInVersion = null;
    }
    if (status === 'done') {
      data.releasedAt = new Date();
      data.releasedInVersion = prompt(`Enter version name:`, this.appVersionInfo.version);
      if (!data.releasedInVersion) {
        return; // if user clicked "Cancel" in popup
      }
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
}
