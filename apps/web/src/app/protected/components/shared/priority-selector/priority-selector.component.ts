import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { ItemPriority, ItemsCounter } from '../../../interfaces';

@Component({
  selector: 'tt-priority-selector',
  templateUrl: './priority-selector.component.pug',
  styleUrls: ['./priority-selector.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrioritySelectorComponent {
  @Input() priority: null | ItemPriority = null;
  @Input() counter: null | ItemsCounter = null;
  @Input() shouldShowAnyPriority = false;
  @Input() asButton = false;
  @Input() isDropdownLeft = false;
  @Output() set = new EventEmitter<null | ItemPriority>();

  is(priority: null | ItemPriority): boolean {
    return priority === this.priority;
  }

  setHandler(priority: null | ItemPriority): void {
    if (this.is(priority)) {
      return;
    }
    this.set.emit(priority);
  }
}
