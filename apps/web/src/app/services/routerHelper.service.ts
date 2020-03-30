import { ActivatedRoute, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Filter } from '../protected/pages/items/filter/filter.interface';
import { ItemAddEvent } from '../protected/components/shared/items-add/items-add.component';

@Injectable()
export class RouterHelperService {
  constructor(private router: Router, private route: ActivatedRoute) {}

  toItemsWithFilter(filter: Partial<Filter>): void {
    const pathToItems = `/app/links`;
    const isCurrentPage = this.router.url.startsWith(pathToItems);
    const path = isCurrentPage ? [] : [pathToItems];
    this.router.navigate(path, {
      relativeTo: isCurrentPage ? this.route : undefined,
      queryParams: { ...filter, statusNull: filter.status === null ? true : undefined },
      queryParamsHandling: 'merge'
    });
  }

  createItem(item: ItemAddEvent) {
    const pathToItems = `/app/add`;
    const isCurrentPage = this.router.url.startsWith(pathToItems);
    const path = isCurrentPage ? [] : [pathToItems];
    this.router.navigate(path, {
      relativeTo: isCurrentPage ? this.route : undefined,
      queryParams: { ...item, close: false },
      queryParamsHandling: 'merge'
    });
  }
}
