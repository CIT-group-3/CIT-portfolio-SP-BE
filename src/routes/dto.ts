import type { MediaRow } from "../data/titles.js";

export function toTitleDto(row: MediaRow) {
  return {
    uri: `/titles/${encodeURIComponent(row.id)}`,
    type: row.media_type,
    title: row.title,
    releaseYear: row.release_year,
    endYear: row.end_year,
    runtime: row.runtime,
    plot: row.plot,
    poster: row.poster,
  };
}

export function toTitlesListDto(
  rows: MediaRow[],
  page: number,
  pageSize: number,
  totalItems: number,
) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const pageUri = (pageNumber: number) =>
    `/titles?page=${pageNumber}&pageSize=${pageSize}`;

  const validPage = page <= totalPages;

  return {
    items: rows.map(toTitleDto),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      previous:
        validPage && page > 1 ? pageUri(page - 1) : null,
      next:
        validPage && page < totalPages
          ? pageUri(page + 1)
          : null,
    },
  };
}
