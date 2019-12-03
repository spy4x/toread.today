import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { RoadmapComponent } from './roadmap.component';
import { RoadmapActivityComponent } from './activity/activity.component';
import { RoadmapBricksListComponent } from './roadmap-bricks-list/roadmap-bricks-list.component';

const routes: Routes = [
  {
    path: '',
    component: RoadmapComponent
  }
];

@NgModule({
  declarations: [
    RoadmapComponent,
    RoadmapActivityComponent,
    RoadmapBricksListComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
})
export class RoadmapModule {}
