import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { UIService, UserService, ConnectionStatusService, UpdateService } from '../../../../services';
import { DropdownDirective } from '../../shared/dropdown/dropdown.directive';
import { ItemsAddComponent } from '../../shared/items-add/items-add.component';

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
    public updateService: UpdateService,
    public connectionStatus: ConnectionStatusService,
  ) {}

  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
