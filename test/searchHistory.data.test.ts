// Tests the data-access layer directly against the database (2-E.2).
// Every query runs on one client inside a transaction that is rolled
// back afterwards, so repeated runs see the same state.
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../src/db.js";
import {
  clearSearchHistory,
  findSearchHistory,
  findSearchHistoryEntry,
  removeSearchHistoryEntry,
} from "../src/data/searchHistory.js";

let client: PoolClient;
let userId: number;

beforeEach(async () => {
  client = await pool.connect();
  await client.query("BEGIN");

  // Route the data layer's pool.query calls into this transaction.
  vi.spyOn(pool, "query").mockImplementation(
    ((...args: Parameters<PoolClient["query"]>) =>
      client.query(...args)) as typeof pool.query,
  );

  const user = await client.query<{ id: number }>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, 'not-a-real-hash')
     RETURNING id`,
    [`data-${randomUUID().slice(0, 12)}`],
  );
  userId = user.rows[0]!.id;

  await client.query(
    `INSERT INTO search_log (user_id, search_query, timestamp)
     VALUES ($1, 'oldest', DATE '2026-01-01'),
            ($1, 'middle', DATE '2026-01-02'),
            ($1, 'newest', DATE '2026-01-03')`,
    [userId],
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  await client.query("ROLLBACK");
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe("search history data access", () => {
  it("returns one page, newest first, with the total count", async () => {
    const result = await findSearchHistory(userId, 1, 2);

    expect(result.totalItems).toBe(3);
    expect(result.rows.map((row) => row.search_query)).toEqual([
      "newest",
      "middle",
    ]);
  });

  it("returns the remaining entries on the next page", async () => {
    const result = await findSearchHistory(userId, 2, 2);

    expect(result.rows.map((row) => row.search_query)).toEqual(["oldest"]);
  });

  it("finds and removes a single entry", async () => {
    const [first] = (await findSearchHistory(userId, 1, 1)).rows;

    expect(await findSearchHistoryEntry(userId, first!.id)).toMatchObject({
      search_query: "newest",
    });
    expect(await removeSearchHistoryEntry(userId, first!.id)).toBe(true);
    expect(await findSearchHistoryEntry(userId, first!.id)).toBeUndefined();
  });

  it("does not remove another user's entry", async () => {
    const [first] = (await findSearchHistory(userId, 1, 1)).rows;

    expect(await removeSearchHistoryEntry(userId + 1, first!.id)).toBe(false);
  });

  it("clears the whole history", async () => {
    await clearSearchHistory(userId);

    expect((await findSearchHistory(userId, 1, 20)).totalItems).toBe(0);
  });

  it("sees none of the rows from earlier tests", async () => {
    // The fixture user is new in every test, and earlier tests' inserts
    // and deletes were rolled back.
    const leftovers = await pool.query(
      "SELECT 1 FROM users WHERE username LIKE 'data-%' AND id <> $1",
      [userId],
    );

    expect(leftovers.rowCount).toBe(0);
  });
});
