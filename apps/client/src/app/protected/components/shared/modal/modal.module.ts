import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AfsModalComponent } from './modal.component';
import { AfsModalService } from './modal.service';

@NgModule({
  declarations: [
    AfsModalComponent,
  ],
  imports: [
    CommonModule,
  ],
  providers: [
    AfsModalService,
  ],
  exports: [
    AfsModalComponent,
  ]
})
export class AfsModalModule {}
