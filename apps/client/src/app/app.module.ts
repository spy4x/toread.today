import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ConnectionStatusService } from './services/connection-status/connection-status.service';
import { LoggerService, SentryErrorHandler } from './services/logger.service';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ItemsService } from './services/items/items.service';
import { ROUTER_CONSTANTS } from './helpers/router.constants';
import { UIService } from './services/ui.service';
import { RouterHelperService } from './services/routerHelper.service';
import { UserService } from './services/user.service';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { PushNotificationsService } from './services/push-notifications.service';
import { NotificationsService } from './services/notifications.service';
import { TagsService } from './services/tags/tags.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './components/core/core.module';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: './pages/dashboard/dashboard.module#DashboardModule'
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
    path: 'fast-fast-add-and-import',
    loadChildren: './pages/fast-add-and-import/fast-add-and-import.module#FastAddAndImportModule'
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
    redirectTo: 'dashboard'
  }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    CoreModule,
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireAuthModule,
    AngularFireMessagingModule,
    ServiceWorkerModule.register('ngsw-worker.js',
      { enabled: environment.production, registrationStrategy: 'registerImmediately' })
  ],
  providers: [
    ConnectionStatusService,
    LoggerService,
    ItemsService,
    TagsService,
    UIService,
    RouterHelperService,
    UserService,
    PushNotificationsService,
    NotificationsService,
    { provide: ErrorHandler, useClass: SentryErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
