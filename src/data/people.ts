
import { pool } from "../db.js";

export interface PersonRow {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

export interface KnownForTitle {
  id: string;
  title: string;
  media_type: string;
}

export interface PaginatedPeople {
  rows: PersonRow[];
  totalItems: number;
}

export interface PersonSearchResult {
  items: { person_id: string; name: string }[];
  totalItems: number;
}

// Find people with pagination.
export async function findPeople(
  page: number,
  pageSize: number,
): Promise<PaginatedPeople> {
  const offset = (page - 1) * pageSize;

  const [countResult, peopleResult] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM person`,
    ),

    pool.query<PersonRow>(
      `SELECT id, name, birth_year, death_year
       FROM person
       ORDER BY name, id
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
  ]);

  return {
    rows: peopleResult.rows,
    totalItems: Number(countResult.rows[0]?.total ?? 0),
  };
}

// Find one person using their IMDb ID.
export async function findPersonById(
  id: string,
): Promise<PersonRow | undefined> {
  const result = await pool.query<PersonRow>(
    `SELECT id, name, birth_year, death_year
     FROM person
     WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

// Find the titles a person is known for.
export async function findPersonKnownFor(
  personId: string,
): Promise<KnownForTitle[]> {
  const result = await pool.query<KnownForTitle>(
    `SELECT m.id, m.title, m.media_type
     FROM person_known_for pkf
     JOIN media m ON m.id = pkf.media_id
     WHERE pkf.person_id = $1
     ORDER BY pkf.ordering`,
    [personId],
  );

  return result.rows;
}

// Search people using the existing SP1 database function.
// The function also records the search in the user's history.
export async function searchPeople(
  userId: number,
  search: string,
  page: number,
  pageSize: number,
): Promise<PersonSearchResult> {
  const offset = (page - 1) * pageSize;

  const result = await pool.query<{
    person_id: string | null;
    name: string | null;
    total_items: string;
  }>(
    `WITH matches AS MATERIALIZED (
       SELECT * FROM string_search_person($1, $2)
     )
     SELECT page.person_id, page.name, total.total_items
     FROM (
       SELECT COUNT(*) AS total_items
       FROM matches
     ) AS total
     LEFT JOIN (
       SELECT person_id, name
       FROM matches
       ORDER BY name, person_id
       LIMIT $3 OFFSET $4
     ) AS page ON TRUE
     ORDER BY page.name, page.person_id`,
    [userId, search, pageSize, offset],
  );

  const items: { person_id: string; name: string }[] = [];

  for (const row of result.rows) {
    if (row.person_id !== null && row.name !== null) {
      items.push({
        person_id: row.person_id,
        name: row.name,
      });
    }
  }

  return {
    items,
    totalItems: Number(result.rows[0]?.total_items ?? 0),
  };
}
