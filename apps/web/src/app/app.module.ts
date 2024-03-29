import { ErrorHandler, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken, Settings } from '@angular/fire/firestore';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AppComponent } from './app.component';
import {
  ConnectionStatusService,
  ItemService,
  LoggerService,
  NotificationsService,
  PushNotificationsService,
  RouterHelperService,
  SentryErrorHandler,
  TagService,
  UIService,
  UpdateService,
  UserService
} from './services';
import { environment } from '../environments/environment';
import { firestore as Firestore } from 'firebase/app';
import {
  AngularFireAnalyticsModule,
  APP_VERSION,
  ScreenTrackingService,
  UserTrackingService
} from '@angular/fire/analytics';
const { appData } = require('../../ngsw-config.json');

const routes: Routes = [
  {
    path: 'app',
    loadChildren: () => import('./protected/protected.module').then(m => m.ProtectedModule)
  },
  {
    path: '',
    loadChildren: () => import('./public/public.module').then(m => m.PublicModule)
  },
  {
    path: '**',
    redirectTo: 'app'
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireAuthModule,
    AngularFireMessagingModule,
    AngularFireAnalyticsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    })
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
    ScreenTrackingService,
    UserTrackingService,
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler
    },
    {
      provide: FirestoreSettingsToken,
      useValue: <Settings>{
        cacheSizeBytes: Firestore.CACHE_SIZE_UNLIMITED
      }
    },
    {
      provide: APP_VERSION,
      useValue: appData.version
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
