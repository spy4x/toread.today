import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { catchError, filter, shareReplay, startWith, takeUntil, tap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { LoggerService } from '../../services/logger.service';
import { defaultRoadmapBrick, RoadmapBrick } from '../../interfaces/roadmapBrick.interface';
import { firestore } from 'firebase/app';


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
    startWith(JSON.parse(localStorage.getItem('tt-user'))),
    tap(user => {
      this.userId = user ? user.uid : null;
      localStorage.setItem('tt-user', JSON.stringify(user));
      this.logger.setUser(user);
    }),
    catchError(error => {
      this.logger.error({ messageForDev: 'user$ error', error });
      return of(null);
    }));
  userIsNotAuthenticated$ = this.user$.pipe(filter(v => !v));

  roadmapBricks$: Observable<RoadmapBrick[]> = this.firestore
    .collection<RoadmapBrick>(collectionPath,
      ref => ref.orderBy('startWorkingAt', 'desc'))
    .valueChanges({ idField: 'id' })
    .pipe(
      takeUntil(this.userIsNotAuthenticated$),
      takeUntil(this.componentDestroy$),
      catchError(error => {
        this.logger.error(
          { messageForDev: 'roadmapBricks$ error', messageForUser: 'Failed to fetch roadmap.', error });
        return of([]);
      }),
      shareReplay(1)
    );
  @ViewChild('textarea', {static: false}) textarea: ElementRef;

  constructor(private auth: AngularFireAuth,
              private firestore: AngularFirestore,
              private logger: LoggerService) { }

  ngOnDestroy(): void {
    this.componentDestroy$.next();
    this.componentDestroy$.complete();
  }

  async vote(id: string, rate: -1 | 1): Promise<void> {
    const add = firestore.FieldValue.arrayUnion(this.userId);
    const remove = firestore.FieldValue.arrayRemove(this.userId);
    const data = {
      likedBy: rate > 0 ? add : remove,
      dislikedBy: rate > 0 ? remove : add,
    };
    try {
      await this.firestore
        .doc(`${collectionPath}/${id}`)
        .update(data);
    } catch (error) {
      this.logger.error(
        { messageForDev: 'vote() error:', messageForUser: 'Failed to vote for roadmap.', error, params: { id, data } });
    }
  }

  async add(title: string): Promise<void> {
    const newBrick: RoadmapBrick = {
      ...defaultRoadmapBrick,
      title,
      createdBy: this.userId,
      createdAt: new Date(),
      type: this.userId === "carcBWjBqlNUY9V2ekGQAZdwlTf2" ? 'feature' : 'suggestion'
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
}
