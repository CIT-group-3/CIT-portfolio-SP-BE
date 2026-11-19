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

export interface PaginatedTitles {
  rows: MediaRow[];
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
    totalItems: Number(countResult.rows[0]?.total ?? 0),  };
}

// Find movies similar to a given movie.
// Reuses the existing SP1 database function.
export async function findSimilarMovies(
  title: string,
): Promise<SimilarMovie[]> {
  const result = await pool.query<SimilarMovie>(
    `SELECT media_id, title, similarity::float8 AS similarity
     FROM find_similar_movies($1)`,
    [title],
  );

  return result.rows;
}