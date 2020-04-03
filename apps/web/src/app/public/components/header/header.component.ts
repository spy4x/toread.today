import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../../services';

@Component({
  selector: 'tt-public-header',
  templateUrl: './header.component.pug',
  styleUrls: ['./header.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHeaderComponent {
  isMenuExpanded = false;

  constructor(public userService: UserService) {}

  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
