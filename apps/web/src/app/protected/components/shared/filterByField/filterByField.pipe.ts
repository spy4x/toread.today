import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByField'
})
export class FilterByFieldPipe implements PipeTransform {
  transform<T>(
    items: Array<T>,
    filters: { field: string; value; string; match: 'exact' | 'includesString' }[]
  ): null | Array<T> {
    if (!items) {
      return null;
    }
    return items.filter(item => {
      const notMatchingField = filters.find(filter => {
        if (!item) {
          return true;
        }
        const itemValue = item[filter.field];
        switch (filter.match) {
          case 'exact':
            return itemValue !== filter.value;
          case 'includesString': {
            if (typeof itemValue !== 'string' || typeof filter.value !== 'string') {
              return true;
            }
            return (itemValue as string).toLowerCase().indexOf(filter.value.toLowerCase()) === -1;
          }
        }
      });
      return !notMatchingField; // true if matches all fields
    });
  }
}
