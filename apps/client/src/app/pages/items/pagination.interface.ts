export interface Pagination {
  isLoading: boolean
  page: number
  lastItemId: null | string
  nextItemsAvailable: boolean
}

export const defaultPagination: Pagination = {
  isLoading: false,
  page: 0,
  lastItemId: null,
  nextItemsAvailable: false,
};
