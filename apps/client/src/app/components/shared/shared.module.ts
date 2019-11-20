import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DropdownDirective } from './dropdown/dropdown.directive';
import { FilterByFieldPipe } from './filterByField/filterByField.pipe';
import { PrioritySelectorComponent } from './priority-selector/priority-selector.component';
import { TagSelectorComponent } from './tag-selector/tag-selector.component';
import { TagsByIdsPipe } from './tags-by-ids/tags-by-ids.pipe';
import { FormsModule } from '@angular/forms';
import { ListComponent } from './items-list/list.component';
import { ListItemComponent } from './items-list/items-list-item/list-item.component';

@NgModule({
  declarations: [
    DropdownDirective,
    FilterByFieldPipe,
    PrioritySelectorComponent,
    TagSelectorComponent,
    TagsByIdsPipe,
    ListComponent,
    ListItemComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  exports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TagSelectorComponent,
    PrioritySelectorComponent,
    TagsByIdsPipe,
    FilterByFieldPipe,
    DropdownDirective,
    ListComponent,
    ListItemComponent,
  ],
  providers: []
})
export class SharedModule {}
