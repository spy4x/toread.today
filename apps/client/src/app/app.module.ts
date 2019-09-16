import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { ListComponent } from './list/list.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FilterComponent } from './filter/filter.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TagsEditorComponent } from './tags-editor/tags-editor.component';
import { TagSelectorComponent } from './tag-selector/tag-selector.component';
import { ItemsAddComponent } from './items-add/items-add.component';
import { TagTitleByIdPipe } from './tag-title-by-id/tag-title-by-id.pipe';
import { GetIconByItemTypePipe } from './get-icon-by-item-type/get-icon-by-item-type.pipe';
import { DropdownDirective } from './dropdown/dropdown.directive';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ConnectionStatusService } from './connection-status/connection-status.service';
import { LoggerService, SentryErrorHandler } from './services/logger.service';
import { RouterModule, Routes } from '@angular/router';
import { ItemsComponent } from './items/items.component';
import { TagsComponent } from './tags/tags.component';
import { FormsModule } from '@angular/forms';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { NotificationsComponent } from './notifications/notifications.component';
import { FastAddAndImportComponent } from './fast-add-and-import/fast-add-and-import.component';
import { ItemsImportComponent } from './items-import/items-import.component';
import { ItemsImportListComponent } from './items-import-list/items-import-list.component';
import { ItemsService } from './services/items/items.service';
import { HttpClientModule } from '@angular/common/http';

const routes: Routes = [
  {
    path: 'items',
    component: ItemsComponent,
  },
  {
    path: 'tags',
    component: TagsComponent,
  },
  {
    path: 'fast-fast-add-and-import',
    component: FastAddAndImportComponent,
  },
  {
    path: '**',
    redirectTo: 'items',
  },
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
    GetIconByItemTypePipe,
    DropdownDirective,
    ItemsComponent,
    TagsComponent,
    NotificationsComponent,
    FastAddAndImportComponent,
    ItemsImportComponent,
    ItemsImportListComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence({synchronizeTabs: true}),
    AngularFireAuthModule,
    AngularFireStorageModule,
    InfiniteScrollModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    ConnectionStatusService,
    LoggerService,
    ItemsService,
    { provide: ErrorHandler, useClass: SentryErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
