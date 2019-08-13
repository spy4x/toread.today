import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';
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
import { LoggerService, SentryErrorHandler } from './logger.service';
import { RouterModule, Routes } from '@angular/router';
import { ItemsComponent } from './items/items.component';
import { TagsComponent } from './tags/tags.component';

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
    TagsComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    InfiniteScrollModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    ConnectionStatusService,
    LoggerService,
    { provide: ErrorHandler, useClass: SentryErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
