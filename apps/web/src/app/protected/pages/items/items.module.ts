import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../components/shared/shared.module';
import { ItemsComponent } from './items.component';
import { AreaChartModule, BarChartModule, LineChartModule } from '@swimlane/ngx-charts';
import { StatisticsComponent } from './statistics/statistics.component';
import { ItemsFilterDescriptionComponent } from './items-filter-description/items-filter-description.component';
import { ItemsFilterDesktopComponent } from './filter/desktop/filter.component';
import { ItemsFilterMobileComponent } from './filter/mobile/filter.component';

const routes: Routes = [
  {
    path: '',
    component: ItemsComponent
  }
];

@NgModule({
  declarations: [
    ItemsComponent,
    ItemsFilterDesktopComponent,
    ItemsFilterMobileComponent,
    ItemsFilterDescriptionComponent,
    StatisticsComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes), LineChartModule, BarChartModule, AreaChartModule]
})
export class ItemsModule {}
