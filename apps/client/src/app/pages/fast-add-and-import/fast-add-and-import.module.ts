import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FastAddAndImportComponent } from './fast-add-and-import.component';
import { ItemsImportComponent } from './items-import/items-import.component';
import { ItemsImportListComponent } from './items-import-list/items-import-list.component';
import { SharedModule } from '../../components/shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: FastAddAndImportComponent
  }
];

@NgModule({
  declarations: [
    FastAddAndImportComponent,
    ItemsImportComponent,
    ItemsImportListComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class FastAddAndImportModule {}
