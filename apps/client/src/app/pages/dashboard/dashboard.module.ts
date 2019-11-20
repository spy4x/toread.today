import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { DashboardStatisticsComponent } from './statistics/statistics.component';
import { LineChartModule } from '@swimlane/ngx-charts';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
];

@NgModule({
  declarations: [
    DashboardStatisticsComponent,
    DashboardComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    LineChartModule
  ],
  exports: [RouterModule],
  providers: []
})
export class DashboardModule {}
