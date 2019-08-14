import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { User } from 'firebase';
import { AppVersionInfo } from '../../appVersionInfo.interface';

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
  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }
  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
