import { pool } from "../db.js";

export interface MediaRow {
  id: string;
  media_type: string;
  title: string;
  is_adult: boolean;
  release_year: string | null;
  end_year: string | null;
  runtime: number | null;
  plot: string | null;
  poster: string | null;
}

export async function findMediaById(id: string): Promise<MediaRow | undefined> {
  const result = await pool.query<MediaRow>(
    `SELECT id, media_type, title, is_adult, release_year, end_year, runtime, plot, poster
     FROM media WHERE id = $1`,
    [id],
  );
  return result.rows[0];
}
