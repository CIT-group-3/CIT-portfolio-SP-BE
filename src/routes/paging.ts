export interface PaginationParams {
    page: number;
    pageSize: number;
  }
  
  const DEFAULT_PAGE = 1;
  const DEFAULT_PAGE_SIZE = 20;
  const MAX_PAGE_SIZE = 100;
  
  function parsePositiveInteger(value: unknown): number | undefined {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
      return undefined;
    }
  
    const parsed = Number(value);
  
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      return undefined;
    }
  
    return parsed;
  }
  
  export function parsePagination(
    pageValue: unknown,
    pageSizeValue: unknown,
  ): PaginationParams | null {
    const page =
      pageValue === undefined
        ? DEFAULT_PAGE
        : parsePositiveInteger(pageValue);
  
    const requestedPageSize =
      pageSizeValue === undefined
        ? DEFAULT_PAGE_SIZE
        : parsePositiveInteger(pageSizeValue);
  
    if (page === undefined || requestedPageSize === undefined) {
      return null;
    }
  
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;
  
    if (!Number.isSafeInteger(offset)) {
      return null;
    }
  
    return { page, pageSize };
  }

// Creates the pagination block shared by every paged list response.
export function createPagination(
  page: number,
  pageSize: number,
  totalItems: number,
  pageUri: (pageNumber: number) => string,
) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const validPage = page <= totalPages;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    previous: validPage && page > 1 ? pageUri(page - 1) : null,
    next: validPage && page < totalPages ? pageUri(page + 1) : null,
  };
}
