import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { AddComponent } from './add.component';

const routes: Routes = [
  {
    path: '',
    component: AddComponent
  }
];

@NgModule({
  declarations: [
    AddComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class AddModule {}
