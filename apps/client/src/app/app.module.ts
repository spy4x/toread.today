import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { ListComponent } from './common-components/items-list/list.component';
import { NavbarComponent } from './common-components/navbar/navbar.component';
import { FilterComponent } from './pages/items/filter/filter.component';
import { TagsEditorComponent } from './pages/tags/editor/tags-editor.component';
import { TagSelectorComponent } from './common-components/tag-selector/tag-selector.component';
import { ItemsAddComponent } from './common-components/items-add/items-add.component';
import { TagTitleByIdPipe } from './common-components/tag-title-by-id/tag-title-by-id.pipe';
import { DropdownDirective } from './common-components/dropdown/dropdown.directive';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ConnectionStatusService } from './services/connection-status/connection-status.service';
import { LoggerService, SentryErrorHandler } from './services/logger.service';
import { RouterModule, Routes } from '@angular/router';
import { ItemsComponent } from './pages/items/items.component';
import { TagsComponent } from './pages/tags/tags.component';
import { FormsModule } from '@angular/forms';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { NotificationsComponent } from './common-components/notifications/notifications.component';
import { FastAddAndImportComponent } from './pages/fast-add-and-import/fast-add-and-import.component';
import { ItemsImportComponent } from './pages/fast-add-and-import/items-import/items-import.component';
import { ItemsImportListComponent } from './pages/fast-add-and-import/items-import-list/items-import-list.component';
import { ItemsService } from './services/items/items.service';
import { HttpClientModule } from '@angular/common/http';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ROUTER_CONSTANTS } from './helpers/router.constants';
import { RoadmapComponent } from './pages/roadmap/roadmap.component';
import { BricksListComponent } from './pages/roadmap/bricks-list/bricks-list.component';
import { RoadmapActivityComponent } from './pages/roadmap/activity/activity.component';
import { UIService } from './services/ui.service';
import { FilterByFieldPipe } from './common-components/filterByField/filterByField.pipe';
import { RouterHelperService } from './services/routerHelper.service';
import { UserService } from './services/user.service';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: ROUTER_CONSTANTS.items.path,
    component: ItemsComponent
  },
  {
    path: 'tags',
    component: TagsComponent
  },
  {
    path: 'fast-fast-add-and-import',
    component: FastAddAndImportComponent
  },
  {
    path: 'roadmap',
    component: RoadmapComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    NavbarComponent,
    FilterComponent,
    TagsEditorComponent,
    TagSelectorComponent,
    ItemsAddComponent,
    TagTitleByIdPipe,
    DropdownDirective,
    ItemsComponent,
    TagsComponent,
    NotificationsComponent,
    FastAddAndImportComponent,
    ItemsImportComponent,
    ItemsImportListComponent,
    DashboardComponent,
    RoadmapComponent,
    BricksListComponent,
    RoadmapActivityComponent,
    FilterByFieldPipe,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireAuthModule,
    AngularFireStorageModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production, registrationStrategy: 'registerImmediately' }),
    FormsModule,
    HttpClientModule
  ],
  providers: [
    ConnectionStatusService,
    LoggerService,
    ItemsService,
    UIService,
    RouterHelperService,
    UserService,
    { provide: ErrorHandler, useClass: SentryErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
