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
        loadChildren: './pages/add/add.module#AddModule'
      },
      {
        path: ROUTER_CONSTANTS.items.path,
        loadChildren: './pages/items/items.module#ItemsModule'
      },
      {
        path: 'tags',
        loadChildren: './pages/tags/tags.module#TagsModule'
      },
      {
        path: 'import',
        loadChildren: './pages/import/import.module#ImportModule'
      },
      {
        path: 'roadmap',
        loadChildren: './pages/roadmap/roadmap.module#RoadmapModule'
      },
      {
        path: 'profile',
        loadChildren: './pages/profile/profile.module#ProfileModule'
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
  declarations: [
    ProtectedPageComponent
  ],
  imports: [
    CoreModule,
    RouterModule.forChild(routes),
  ],
  providers: []
})
export class ProtectedModule {
}
