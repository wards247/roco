export const MAX_PAGE_SIZE = 1000;

export const clampPageNumber = (pageNumber: number, totalPages: number): number => {
  const normalizedPage = Number.isFinite(pageNumber) ? Math.trunc(pageNumber) : 1;
  const normalizedTotal = Math.max(1, Math.trunc(totalPages));

  return Math.min(Math.max(normalizedPage, 1), normalizedTotal);
};

export const clampPageSize = (pageSize: number): number => {
  const normalizedPageSize = Number.isFinite(pageSize) ? Math.trunc(pageSize) : 10;

  return Math.min(Math.max(normalizedPageSize, 1), MAX_PAGE_SIZE);
};
