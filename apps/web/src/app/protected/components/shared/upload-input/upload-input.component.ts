import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Subscription, Observable, merge, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'tt-upload-input',
  templateUrl: './upload-input.component.pug',
  styleUrls: ['./upload-input.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadInputComponent implements OnInit, OnDestroy {
  @Output() selected = new EventEmitter<any>();

  componentCSSSelector = '.file';
  dragoverCSSClass = 'has-dragover';

  sub = new Subscription();
  drag$: Observable<boolean>;

  ngOnInit() {
    const dropzoneElement = document.querySelector(this.componentCSSSelector);
    const dragEnterObserver = fromEvent(document.body, 'dragenter').pipe(map(() => true));
    const dragLeaveObserver = fromEvent(dropzoneElement, 'dragleave').pipe(map(() => false));
    const dropObserver = fromEvent(dropzoneElement, 'drop').pipe(map(() => false));
    this.drag$ = merge(dragEnterObserver, dragLeaveObserver, dropObserver);
    this.sub.add(
      this.drag$.subscribe(isDragged => {
        if (isDragged) {
          document.body.classList.add(this.dragoverCSSClass);
        } else {
          document.body.classList.remove(this.dragoverCSSClass);
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
