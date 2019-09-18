import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { User } from 'firebase';
import { AppVersionInfo } from '../../../appVersionInfo.interface';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'tt-navbar',
  templateUrl: './navbar.component.pug',
  styleUrls: ['./navbar.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  @Input() user: User;
  @Input() appVersionInfo: AppVersionInfo;
  @Output() signOut = new EventEmitter<void>();
  isMenuExpanded = false;
  isMobile$ = fromEvent(window, 'resize')
    .pipe(
      debounceTime(200),
      map(() => window.innerWidth),
      distinctUntilChanged(),
      startWith(window.innerWidth),
      map(width => width <= 1024),
      shareReplay(1),
    );
  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }
  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
