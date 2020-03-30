import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportPageComponent } from './import.component';
import { SharedModule } from '../../components/shared/shared.module';
import { BookmarkletPageComponent as ImportBookmarkletPageComponent } from './bookmarklet/bookmarklet.component';

const routes: Routes = [
  {
    path: '',
    component: ImportPageComponent
  },
  {
    path: 'bulk',
    loadChildren: () => import('./bulk/bulk.module').then(m => m.ImportBulkModule)
  },
  {
    path: 'bookmarklet',
    component: ImportBookmarkletPageComponent
  }
];

@NgModule({
  declarations: [ImportPageComponent, ImportBookmarkletPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class ImportModule {}
