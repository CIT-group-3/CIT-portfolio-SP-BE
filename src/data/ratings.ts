
import { pool } from "../db.js";

export interface UserRating {
  media_id: string;
  title: string;
  media_type: string;
  rating: number;
  review: string | null;
  timestamp: string;
}

// Get all ratings belonging to one user.
// Reuses the existing SP1 database function.
export async function findUserRatings(
  userId: number,
): Promise<UserRating[]> {
  const result = await pool.query<UserRating>(
    `SELECT r.media_id,
            m.title,
            m.media_type,
            r.rating,
            r.review,
            r."timestamp"::text AS timestamp
     FROM get_user_ratings($1) r
     JOIN media m ON m.id = r.media_id
     ORDER BY r."timestamp" DESC, r.media_id`,
    [userId],
  );

  return result.rows;
}

// Find one rating belonging to the user for a specific title.
export async function findUserRating(
  userId: number,
  mediaId: string,
): Promise<UserRating | undefined> {
  const result = await pool.query<UserRating>(
    `SELECT r.media_id,
            m.title,
            m.media_type,
            r.rating,
            r.review,
            r."timestamp"::text AS timestamp
     FROM get_user_ratings($1) r
     JOIN media m ON m.id = r.media_id
     WHERE r.media_id = $2`,
    [userId, mediaId],
  );

  return result.rows[0];
}

// Add a rating using the new database function.
export async function addUserRating(
  userId: number,
  mediaId: string,
  rating: number,
): Promise<number | null> {
  const result = await pool.query<{ average_rating: string | null }>(
    "SELECT rate($1, $2, $3) AS average_rating",
    [userId, mediaId, rating],
  );

  const average = result.rows[0]?.average_rating;

  return average === null || average === undefined
    ? null
    : Number(average);
}

// Update an existing rating.
export async function updateUserRating(
  userId: number,
  mediaId: string,
  rating: number,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE user_rating
     SET rating = $3, timestamp = CURRENT_DATE
     WHERE user_id = $1 AND media_id = $2`,
    [userId, mediaId, rating],
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Delete an existing rating.
export async function removeUserRating(
  userId: number,
  mediaId: string,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM user_rating
     WHERE user_id = $1 AND media_id = $2`,
    [userId, mediaId],
  );

  return result.rowCount !== null && result.rowCount > 0;
}
