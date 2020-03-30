import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';
import { TagUpdateEvent } from './editor/tags-editor.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoggerService } from '../../../services/logger.service';
import { ItemService } from '../../../services/items/items.service';
import { TagService } from '../../../services/tags/tags.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'tt-tags',
  templateUrl: './tags.component.pug',
  styleUrls: ['./tags.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent {
  counter$ = this.itemService.getCounter$();

  constructor(
    public tagService: TagService,
    private userService: UserService,
    private firestore: AngularFirestore,
    private logger: LoggerService,
    private itemService: ItemService
  ) {}

  async create(tag: Tag) {
    // TODO: Move to tagService
    tag.createdBy = this.userService.userId;
    try {
      await this.firestore.collection('tags').add(tag);
    } catch (error) {
      this.logger.error({
        messageForDev: 'createTag() error:',
        messageForUser: 'Failed to save tag.',
        error,
        params: { ...tag }
      });
    }
  }

  async update(event: TagUpdateEvent) {
    // TODO: Move to tagService
    try {
      await this.firestore.doc('tags/' + event.id).update(event.change);
    } catch (error) {
      this.logger.error({
        messageForDev: 'updateTag() error:',
        messageForUser: 'Failed to update tag.',
        error,
        params: { ...event }
      });
    }
  }
}
