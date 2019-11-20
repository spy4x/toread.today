import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { AppVersionInfo } from '../../../../appVersionInfo.interface';
import { UIService } from '../../../services/ui.service';
import { User } from '../../../interfaces/user.interface';

@Component({
  selector: 'tt-navbar',
  templateUrl: './navbar.component.pug',
  styleUrls: ['./navbar.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  @Input() user: User;
  @Input() appVersionInfo: AppVersionInfo;
  @Output() signOut = new EventEmitter<void>();
  isMenuExpanded = false;

  constructor(public uiService: UIService) {}

  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
