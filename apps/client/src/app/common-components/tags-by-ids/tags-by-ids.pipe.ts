import { Pipe, PipeTransform } from '@angular/core';
import { Tag } from '../../interfaces/tag.interface';

@Pipe({
  name: 'tagsByIds'
})
export class TagsByIdsPipe implements PipeTransform {
  transform(ids: string[], tags: Tag[]): Tag[] {
    if(!ids || !ids.length || !tags) {
      return [];
    }
    return ids.reduce((acc, id) => {
      const foundTag = tags.find(tag => tag.id === id);
      if (foundTag) {
        return [...acc, foundTag];
      } else {
        const fakeTag: Tag = {
          id,
          title: '',
          color: '',
          mergeIntoTagId: null,
          createdBy: '',
          createdAt: new Date(),
        };
        return [...acc, fakeTag]
      }
    }, []);
  }
}
