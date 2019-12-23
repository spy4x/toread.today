import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { TagsComponent } from './tags.component';
import { TagsEditorComponent } from './editor/tags-editor.component';

const routes: Routes = [
  {
    path: '',
    component: TagsComponent
  }
];

@NgModule({
  declarations: [
    TagsComponent,
    TagsEditorComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
})
export class TagsModule {}
