import { Injectable } from '@angular/core';
import { AfsModalComponent } from './modal.component';

// USAGE EXAMPLE:
// const result = await this.modalService.open('deleteTagModal', { tag, linksAmount: this.counter[`tags.${tag.id}`] });

@Injectable()
export class AfsModalService {
  modals: AfsModalComponent[] = [];

  register(modal: AfsModalComponent): void {
    this.modals.push(modal);
    console.log('register', this.modals);
  }

  unregister(modal: AfsModalComponent): void {
    this.modals.splice(this.modals.indexOf(modal), 1);
    console.log('unregister', this.modals);
  }

  open(modalId: string, params?: any): Promise<any> {
    const modal = this.findModal(modalId);
    return modal.open(params);
  }

  close(modalId: string): void {
    const modal = this.findModal(modalId);
    modal.close();
  }

  private findModal(id: string): AfsModalComponent {
    const modal = this.modals.find(m => m.id === id);
    if (!modal) {
      throw new Error(`Modal with id "${id}" was not found.`);
    }
    return modal;
  }
}
