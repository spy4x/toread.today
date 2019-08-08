import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'firebase';

@Component({
  selector: 'tt-navbar',
  templateUrl: './navbar.component.pug',
  styleUrls: ['./navbar.component.sass']
})
export class NavbarComponent {
  @Input() user: User;
  @Output() signOut = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<string>();
}
