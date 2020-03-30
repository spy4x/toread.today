import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'tt-public-header',
  templateUrl: './header.component.pug',
  styleUrls: ['./header.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHeaderComponent {
  isMenuExpanded = false;

  toggleMenu(): void {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu(): void {
    this.isMenuExpanded = false;
  }
}
