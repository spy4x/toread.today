import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { ItemsComponent } from './items.component';
import { ItemsFilterComponent } from './filter/filter.component';

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent
  }
];

@NgModule({
  declarations: [
    ItemsComponent,
    ItemsFilterComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ItemsModule {}
