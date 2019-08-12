import { Pipe, PipeTransform } from '@angular/core';
import { Tag } from '../tag.interface';

@Pipe({
  name: 'tagTitleById'
})
export class TagTitleByIdPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    const tagId: string = value;
    const tags: Tag[] = args[0];
    if(!tags) {
      return 'tags were not provided';
    }
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.title : 'Tag not found';
  }
}
