import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ConnectionStatusService, UIService, UserService } from '../../../../services';

@Component({
  selector: 'tt-navbar',
  templateUrl: './navbar.component.pug',
  styleUrls: ['./navbar.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  isMenuExpanded = false;

  constructor(
    public uiService: UIService,
    public userService: UserService,
    public connectionStatus: ConnectionStatusService
  ) {}

  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
