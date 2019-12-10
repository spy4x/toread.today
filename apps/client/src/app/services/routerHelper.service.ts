import { ActivatedRoute, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Filter } from '../pages/items/filter/filter.interface';

@Injectable()
export class RouterHelperService {

  constructor(private router: Router,
              private route: ActivatedRoute){}

  toItemsWithFilter(filter: Partial<Filter>): void {
    const pathToItems = `/items`;
    const isCurrentPageItems = this.router.url.startsWith(pathToItems);
    const path = isCurrentPageItems ? [] : [pathToItems];
    this.router.navigate(
      path,
      {
        relativeTo: isCurrentPageItems ? this.route : undefined,
        queryParams: { ...filter },
        queryParamsHandling: 'merge'
      });
  }
}
