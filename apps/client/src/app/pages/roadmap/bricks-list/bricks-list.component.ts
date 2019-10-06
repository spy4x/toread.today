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
  @Output() vote = new EventEmitter<RoadmapBrickVoteEvent>();
  @Output() changeTitle = new EventEmitter<RoadmapBrickChangeTitleEvent>();
  @Output() changeType = new EventEmitter<RoadmapBrickChangeTypeEvent>();
  @Output() changeStatus = new EventEmitter<RoadmapBrickChangeStatusEvent>();
  @Output() remove = new EventEmitter<string>();


  changeTitleHandler(brick: RoadmapBrick, title: string): void {
    this.toggleEditMode(brick.id);
    this.changeTitle.emit({brick, title});
  }
}
