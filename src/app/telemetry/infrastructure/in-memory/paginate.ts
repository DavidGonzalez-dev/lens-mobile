import type { Page, Pagination } from '../../domain';

/** Cuts one page out of an already filtered and sorted list. */
export function paginate<T>(items: T[], pagination: Pagination): Page<T> {
  const pageEnd = pagination.offset + pagination.limit;

  return {
    data: items.slice(pagination.offset, pageEnd),
    hasMore: pageEnd < items.length,
  };
}
