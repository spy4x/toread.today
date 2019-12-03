import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportBulkPageComponent } from './bulk.component';
import { ImportBulkComponent } from './items-import/items-import.component';
import { ImportBulkListComponent } from './items-import-list/items-import-list.component';
import { SharedModule } from '../../../components/shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: ImportBulkPageComponent
  }
];

@NgModule({
  declarations: [
    ImportBulkPageComponent,
    ImportBulkComponent,
    ImportBulkListComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
})
export class ImportBulkModule {}
