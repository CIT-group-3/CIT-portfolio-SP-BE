import type { MediaRow } from "../data/titles.js";

export function toTitleDto(row: MediaRow) {
  return {
    url: `/titles/${row.id}`,
    type: row.media_type,
    title: row.title,
    releaseYear: row.release_year,
    endYear: row.end_year,
    runtime: row.runtime,
    plot: row.plot,
    poster: row.poster,
  };
}
