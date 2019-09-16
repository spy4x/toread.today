import { Pipe, PipeTransform } from '@angular/core';
import { ItemType } from '../interfaces/item.interface';

@Pipe({
  name: 'getIconByItemType'
})
export class GetIconByItemTypePipe implements PipeTransform {

  transform(value: ItemType): string {
    switch(value) {
      case 'website': return 'fas fa-globe-americas';
      case 'video': return 'fas fa-video';
      case 'article': return 'far fa-file-alt';
      case 'profile': return 'far fa-user';
      default: return 'far fa-file';
    }
  }

}
