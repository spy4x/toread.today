import { ErrorHandler, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AppComponent } from './app.component';
import { CoreModule } from './components/core/core.module';
import { UpdateService, NotificationsService, ConnectionStatusService, LoggerService, ItemService, TagService, UIService, RouterHelperService, UserService, PushNotificationsService, SentryErrorHandler } from './services';
import { environment } from '../environments/environment';
import { ROUTER_CONSTANTS } from './helpers';

const routes: Routes = [
  {
    path: 'add',
    loadChildren: './pages/add/add.module#AddModule'
  },
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
    ItemService,
    TagService,
    UIService,
    RouterHelperService,
    UserService,
    PushNotificationsService,
    NotificationsService,
    UpdateService,
    { provide: ErrorHandler, useClass: SentryErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
