import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, tap } from 'rxjs/operators';


@Injectable()
export class UIService {
  isMobile: boolean;
  isMobile$ = fromEvent(window, 'resize')
    .pipe(
      debounceTime(200),
      map(() => window.innerWidth),
      distinctUntilChanged(),
      startWith(window.innerWidth),
      map(width => width <= 1024),
      tap(isMobile => this.isMobile = isMobile),
      shareReplay(1),
    );
}
