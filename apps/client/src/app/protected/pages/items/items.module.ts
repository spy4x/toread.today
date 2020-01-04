import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { ItemsComponent } from './items.component';
import { LineChartModule, BarChartModule, AreaChartModule } from '@swimlane/ngx-charts';
import { StatisticsComponent } from './statistics/statistics.component';
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
    ItemsFilterComponent,
    StatisticsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    LineChartModule,
    BarChartModule,
    AreaChartModule,
  ]
})
export class ItemsModule {}
