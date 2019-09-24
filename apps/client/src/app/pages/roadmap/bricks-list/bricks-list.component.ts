import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { RoadmapBrick, RoadmapBrickStatus, RoadmapBrickType } from '../../../interfaces/roadmapBrick.interface';


export interface RoadmapBrickVoteEvent {
  brick: RoadmapBrick
  rate: -1 | 1
}
export interface RoadmapBrickChangeTitleEvent {
  brick: RoadmapBrick
  title: string
}
export interface RoadmapBrickChangeTypeEvent {
  brick: RoadmapBrick
  type: RoadmapBrickType
}
export interface RoadmapBrickChangeStatusEvent {
  brick: RoadmapBrick
  status: RoadmapBrickStatus
}


@Component({
  selector: 'tt-bricks-list',
  templateUrl: './bricks-list.component.pug',
  styleUrls: ['./bricks-list.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BricksListComponent {
  @Input() bricks: RoadmapBrick[];
  @Input() userId: string;
  bricksInEditMode: string[] = [];
  antonId = 'carcBWjBqlNUY9V2ekGQAZdwlTf2';


  toggleEditMode(id: string): void {
    if (!this.bricksInEditMode.includes(id)) {
      this.bricksInEditMode = [...this.bricksInEditMode, id];
    } else {
      this.bricksInEditMode = this.bricksInEditMode.filter(bid => bid !== id);
    }
  }

  isInEditMode(id: string): boolean {
    return this.bricksInEditMode.includes(id);
  }
  // @Input() pagination: Pagination;
  @Output() vote = new EventEmitter<RoadmapBrickVoteEvent>();
  @Output() changeTitle = new EventEmitter<RoadmapBrickChangeTitleEvent>();
  @Output() changeType = new EventEmitter<RoadmapBrickChangeTypeEvent>();
  @Output() changeStatus = new EventEmitter<RoadmapBrickChangeStatusEvent>();
  @Output() remove = new EventEmitter<string>();


  changeTitleHandler(brick: RoadmapBrick, title: string): void {
    this.toggleEditMode(brick.id);
    this.changeTitle.emit({brick, title});
  }
  // @Output() finishReading = new EventEmitter<string>();
  // @Output() undoReading = new EventEmitter<string>();
  // @Output() delete = new EventEmitter<string>();
  // @Output() retryURLParsing = new EventEmitter<string>();
  // @Output() toggleTag = new EventEmitter<ToggleItemTagEvent>();
  // @Output() toggleFavourite = new EventEmitter<ToggleItemFavouriteEvent>();
  // @Output() loadPrev = new EventEmitter<void>();
  // @Output() loadNext = new EventEmitter<void>();
  // @Output() tagClick = new EventEmitter<string>();
  // @Output() changeRating = new EventEmitter<ChangeItemRatingEvent>();
  // @Output() changeComment = new EventEmitter<ChangeItemCommentEvent>();
  // openedComments: {[id: string]: boolean} = {};

  // toggleTagHandler(event: ToggleTagEvent, item: Item) {
  //   this.toggleTag.emit({ ...event, itemId: item.id });
  // }
  //
  // isZeroItems(): boolean {
  //   return this.bricks && !this.bricks.length;
  // }
  //
  // toggleFavouriteHandler(item: Item): void {
  //   const event: ToggleItemFavouriteEvent = { id: item.id, isFavourite: !item.isFavourite };
  //   this.toggleFavourite.emit(event);
  // }
  //
  // setRating(item: Item, rating: ItemRating): void {
  //   this.changeRating.emit({ id: item.id, rating });
  // }
  //
  // read(item: Item): void {
  //   if (item.status !== 'new') {
  //     return;
  //   }
  //   this.startReading.emit(item.id);
  // }
  //
  // setComment(id: string, comment: string): void {
  //   this.changeComment.emit({id, comment});
  //   this.toggleComment(id, false);
  // }
  //
  // toggleComment(id: string, show?: boolean): void {
  //   this.openedComments[id] = typeof show === 'undefined' ? !this.openedComments[id] : show;
  // }
}
