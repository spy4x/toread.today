import { Pipe, PipeTransform } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';

@Pipe({
  name: 'tagById'
})
export class TagTitleByIdPipe implements PipeTransform {
  transform(value: string, tags: Tag[]): null | Tag {
    if(!tags) {
      return null;
    }
    return tags.find(t => t.id === value);
  }
}
