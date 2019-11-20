import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { ItemsComponent } from './items.component';
import { ItemsFilterComponent } from './filter/filter.component';
import { ItemsAddComponent } from './items-add/items-add.component';

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent
  }
];

@NgModule({
  declarations: [
    ItemsComponent,
    ItemsFilterComponent,
    ItemsAddComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class ItemsModule {}
