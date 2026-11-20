import { pool } from "../db.js";

export interface TitleBookmarkRow {
  media_id: string;
  title: string;
  media_type: string;
  timestamp: string;
}

export interface PersonBookmarkRow {
  person_id: string;
  name: string;
  timestamp: string;
}

export interface PaginatedBookmarks<Row> {
  rows: Row[];
  totalItems: number;
}

export async function findTitleBookmarks(
  userId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedBookmarks<TitleBookmarkRow>> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<TitleBookmarkRow & { total_items: string }>(
    `SELECT b.media_id,
            m.title,
            m.media_type,
            b.timestamp::text AS timestamp,
            COUNT(*) OVER()::text AS total_items
     FROM get_user_bookmarked_media($1) b
     JOIN media m ON m.id = b.media_id
     ORDER BY b.timestamp DESC, b.media_id
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset],
  );

  return {
    rows: result.rows,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

export async function addTitleBookmark(
  userId: number,
  titleId: string,
): Promise<void> {
  await pool.query("SELECT bookmark_media_create($1, $2)", [
    userId,
    titleId,
  ]);
}

export async function removeTitleBookmark(
  userId: number,
  titleId: string,
): Promise<void> {
  await pool.query("SELECT bookmark_media_delete($1, $2)", [
    userId,
    titleId,
  ]);
}

export async function findPersonBookmarks(
  userId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedBookmarks<PersonBookmarkRow>> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<PersonBookmarkRow & { total_items: string }>(
    `SELECT b.person_id,
            p.name,
            b.timestamp::text AS timestamp,
            COUNT(*) OVER()::text AS total_items
     FROM get_user_bookmarked_person($1) b
     JOIN person p ON p.id = b.person_id
     ORDER BY b.timestamp DESC, b.person_id
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset],
  );

  return {
    rows: result.rows,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}

export async function addPersonBookmark(
  userId: number,
  personId: string,
): Promise<void> {
  await pool.query("SELECT bookmark_person_create($1, $2)", [
    userId,
    personId,
  ]);
}

export async function removePersonBookmark(
  userId: number,
  personId: string,
): Promise<void> {
  await pool.query("SELECT bookmark_person_delete($1, $2)", [
    userId,
    personId,
  ]);
}
