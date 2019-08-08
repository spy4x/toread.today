import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Item } from '../item.interface';

@Component({
  selector: 'tt-list',
  templateUrl: './list.component.pug',
  styleUrls: ['./list.component.sass']
})
export class ListComponent {

  @Input() items: Item[];
  @Output() startReading = new EventEmitter<string>();
  @Output() finishReading = new EventEmitter<string>();
  @Output() undoReading = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
}
