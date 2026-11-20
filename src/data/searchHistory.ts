import { pool } from "../db.js";

export interface SearchHistoryRow {
  id: number;
  search_query: string | null;
  timestamp: string | null;
}

// Find one page of the user's search history, newest first.
// Reads search_log directly because get_user_search_log() does not
// return the entry ID needed to address single entries.
export async function findSearchHistory(
  userId: number,
  page: number,
  pageSize: number,
): Promise<{ rows: SearchHistoryRow[]; totalItems: number }> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<SearchHistoryRow & { total_items: string }>(
    `SELECT id,
            search_query,
            timestamp::text AS timestamp,
            COUNT(*) OVER()::text AS total_items
     FROM search_log
     WHERE user_id = $1
     ORDER BY timestamp DESC NULLS LAST, id DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset],
  );

  return {
    rows: result.rows,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

// Find one search-history entry belonging to the user.
export async function findSearchHistoryEntry(
  userId: number,
  searchId: number,
): Promise<SearchHistoryRow | undefined> {
  const result = await pool.query<SearchHistoryRow>(
    `SELECT id, search_query, timestamp::text AS timestamp
     FROM search_log
     WHERE user_id = $1 AND id = $2`,
    [userId, searchId],
  );

  return result.rows[0];
}

// Delete one search-history entry belonging to the user.
export async function removeSearchHistoryEntry(
  userId: number,
  searchId: number,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM search_log
     WHERE user_id = $1 AND id = $2`,
    [userId, searchId],
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Delete the user's whole search history.
export async function clearSearchHistory(userId: number): Promise<void> {
  await pool.query("DELETE FROM search_log WHERE user_id = $1", [userId]);
}
