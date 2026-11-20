
import { pool } from "../db.js";

export interface MediaRow {
  id: string;
  media_type: string;
  title: string;
  is_adult: boolean;
  release_year: number | null;
  end_year: number | null;
  runtime: number | null;
  plot: string | null;
  poster: string | null;
}

export interface SimilarMovie {
  media_id: string;
  title: string;
  similarity: number;
}

export interface PopularActor {
  person_id: string;
  name: string;
  rating: number;
  number_of_votes: number;
}

export interface PaginatedTitles {
  rows: MediaRow[];
  totalItems: number;
}

export interface TitleSearchResult {
  items: { media_id: string; title: string }[];
  totalItems: number;
}

export async function findMediaById(id: string): Promise<MediaRow | undefined> {
  const result = await pool.query<MediaRow>(
    `SELECT id, media_type, title, is_adult, release_year, end_year, runtime, plot, poster
     FROM media WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}

export async function findTitles(
  page: number,
  pageSize: number,
): Promise<PaginatedTitles> {
  const offset = (page - 1) * pageSize;

  const [countResult, titlesResult] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM media`,
    ),

    pool.query<MediaRow>(
      `SELECT id, media_type, title, is_adult, release_year,
              end_year, runtime, plot, poster
       FROM media
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
  ]);

  return {
    rows: titlesResult.rows,
    totalItems: Number(countResult.rows[0]?.total ?? 0),
  };
}

// Search titles and plots using the existing SP1 database function.
// The function also records the search for the authenticated user.
export async function searchTitles(
  userId: number,
  search: string,
  page: number,
  pageSize: number,
): Promise<TitleSearchResult> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<{
    media_id: string | null;
    title: string | null;
    total_items: string;
  }>(
    `WITH matches AS MATERIALIZED (
       SELECT * FROM string_search($1, $2)
     )
     SELECT page.media_id, page.title, total.total_items
     FROM (
       SELECT COUNT(*) AS total_items
       FROM matches
     ) AS total
     LEFT JOIN (
       SELECT media_id, title
       FROM matches
       ORDER BY title, media_id
       LIMIT $3 OFFSET $4
     ) AS page ON TRUE
     ORDER BY page.title, page.media_id`,
    [userId, search, pageSize, offset],
  );

  const items: { media_id: string; title: string }[] = [];

  for (const row of result.rows) {
    if (row.media_id !== null && row.title !== null) {
      items.push({
        media_id: row.media_id,
        title: row.title,
      });
    }
  }

  return {
    items,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

export async function searchStructuredTitles(
  userId: number,
  title: string | null,
  plot: string | null,
  characters: string | null,
  personNames: string | null,
  page: number,
  pageSize: number,
): Promise<TitleSearchResult> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<{
    movie_id: string | null;
    movie_title: string | null;
    total_items: string;
  }>(
    `WITH matches AS MATERIALIZED (
       SELECT *
       FROM structured_string_search($1, $2, $3, $4, $5)
     )
     SELECT page.movie_id, page.movie_title, total.total_items
     FROM (
       SELECT COUNT(*) AS total_items
       FROM matches
     ) AS total
     LEFT JOIN (
       SELECT movie_id, movie_title
       FROM matches
       ORDER BY movie_title, movie_id
       LIMIT $6 OFFSET $7
     ) AS page ON TRUE
     ORDER BY page.movie_title, page.movie_id`,
    [
      userId,
      title,
      plot,
      characters,
      personNames,
      pageSize,
      offset,
    ],
  );

  const items: { media_id: string; title: string }[] = [];

  for (const row of result.rows) {
    if (row.movie_id !== null && row.movie_title !== null) {
      items.push({
        media_id: row.movie_id,
        title: row.movie_title,
      });
    }
  }

  return {
    items,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

// Find popular actors associated with a title.
// Reuses the existing SP1 database function.
export async function findPopularActors(
  title: string,
  page: number,
  pageSize: number,
): Promise<{ items: PopularActor[]; totalItems: number }> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<{
    person_id: string | null;
    name: string | null;
    rating: number | null;
    number_of_votes: number | null;
    total_items: string;
  }>(
    `WITH matches AS MATERIALIZED (
       SELECT *
       FROM media_popular_actors($1)
     )
     SELECT page.person_id, page.name, page.rating,
            page.number_of_votes, total.total_items
     FROM (
       SELECT COUNT(*) AS total_items
       FROM matches
     ) AS total
     LEFT JOIN (
       SELECT person_id, name, rating, number_of_votes
       FROM matches
       ORDER BY rating DESC, name
       LIMIT $2 OFFSET $3
     ) AS page ON TRUE
     ORDER BY page.rating DESC, page.name`,
    [title, pageSize, offset],
  );

  const items: PopularActor[] = [];

  for (const row of result.rows) {
    if (
      row.person_id !== null &&
      row.name !== null &&
      row.rating !== null &&
      row.number_of_votes !== null
    ) {
      items.push({
        person_id: row.person_id,
        name: row.name,
        rating: Number(row.rating),
        number_of_votes: row.number_of_votes,
      });
    }
  }

  return {
    items,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

// Find movies similar to a given movie.
// Reuses the existing SP1 database function.
export async function findSimilarMovies(
  title: string,
  page: number,
  pageSize: number,
): Promise<{ rows: SimilarMovie[]; totalItems: number }> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<SimilarMovie & { total_items: string }>(
    `SELECT media_id, title, similarity::float8 AS similarity,
            COUNT(*) OVER()::text AS total_items
     FROM find_similar_movies($1)
     ORDER BY similarity DESC, media_id
     LIMIT $2 OFFSET $3`,
    [title, pageSize, offset],
  );

  return {
    rows: result.rows,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}
