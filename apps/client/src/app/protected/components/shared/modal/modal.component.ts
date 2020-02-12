import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { AfsModalService } from './modal.service';

// USAGE EXAMPLE:
/*
afs-modal(#deleteTagModal="" id="deleteTagModal")
  ng-template(let-params)
    .modal-card(*ngIf="deleteTagModal.isOpened")
      header.modal-card-head
        p.modal-card-title Delete tag
        button.delete(aria-label="close")
      section.modal-card-body
        form(*ngIf="params.linksAmount")
          p Tag "{{params.tag.title}}" is used in {{params.linksAmount}} link(s). What would you like to delete?
          .field
            .control
              label.radio
                input(type='radio',
                      name="deleteOption",
                      value="onlyTag",
                      [(ngModel)]="params.deleteOption")
                span Only tag
              label.radio
                input(type='radio',
                  name="deleteOption",
                  value="withItems",
                  [(ngModel)]="params.deleteOption")
                span Tag and {{params.linksAmount}} link(s)
      footer.modal-card-foot
        button.button.is-danger(
          [disabled]="params.linksAmount > 0 && !params.deleteOption",
          (click)="deleteTagModal.close(params.linksAmount > 0 ? params.deleteOption : 'onlyTag')"
        ) Delete
        button.button((click)="deleteTagModal.close()") Cancel
 */

@Component({
  selector: 'afs-modal',
  template: `
    <div class="modal" [class.is-active]="isOpened">
      <div class="modal-background" (click)="close()"></div>
      <ng-template [ngTemplateOutlet]="templateRef" [ngTemplateOutletContext]="{$implicit: params}"></ng-template>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AfsModalComponent implements OnInit, OnDestroy {
  @Input() id: string;
  @ContentChild(TemplateRef, {static: false}) templateRef: TemplateRef<any>;
  isOpened = false;
  params: any;
  resolve: Function;

  constructor(private modalService: AfsModalService,
              private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.modalService.register(this);
  }

  ngOnDestroy(): void {
    this.modalService.unregister(this);
  }

  async open(params?: any): Promise<any> {
    this.params = params;
    this.isOpened = true;
    this.cd.detectChanges();
    return new Promise(resolve => this.resolve = resolve);
  }

  close(result?: any): void {
    this.isOpened = false;
    this.cd.detectChanges();
    this.resolve(result);
  }
}
