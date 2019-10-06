import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByField',
})
export class FilterByFieldPipe implements PipeTransform {
  transform<T>(items: Array<T>, filters: { field: string, value, string, match: 'exact' | 'includesString' }[]): null | Array<T> {
    if(!items){
      return null;
    }
    return items.filter(item => {
      const notMatchingField = filters.find(filter => {
        switch(filter.match){
          case 'exact': return item[filter.field] !== filter.value;
          case 'includesString': return (item[filter.field] as string).indexOf(filter.value) === -1;
        }
      });
      return !notMatchingField; // true if matches all fields
    });
  }
}
