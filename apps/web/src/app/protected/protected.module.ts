import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_CONSTANTS } from './helpers';
import { ProtectedPageComponent } from './components/core/protected-page/protected-page.component';
import { CoreModule } from './components/core/core.module';

const routes: Routes = [
  {
    path: '',
    component: ProtectedPageComponent,
    children: [
      {
        path: 'add',
        loadChildren: () => import('./pages/add/add.module').then(m => m.AddModule)
      },
      {
        path: ROUTER_CONSTANTS.items.path,
        loadChildren: () => import('./pages/items/items.module').then(m => m.ItemsModule)
      },
      {
        path: 'tags',
        loadChildren: () => import('./pages/tags/tags.module').then(m => m.TagsModule)
      },
      {
        path: 'import',
        loadChildren: () => import('./pages/import/import.module').then(m => m.ImportModule)
      },
      {
        path: 'roadmap',
        loadChildren: () => import('./pages/roadmap/roadmap.module').then(m => m.RoadmapModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: '**',
        redirectTo: ROUTER_CONSTANTS.items.path
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  declarations: [ProtectedPageComponent],
  imports: [CoreModule, RouterModule.forChild(routes)],
  providers: []
})
export class ProtectedModule {}
