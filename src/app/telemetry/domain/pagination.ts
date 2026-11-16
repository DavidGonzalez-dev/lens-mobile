export interface Pagination {
  limit: number;
  offset: number;
}

export interface Page<T> {
  data: T[];
  hasMore: boolean;
}
