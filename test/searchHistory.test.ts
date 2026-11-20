import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `history-${randomUUID().slice(0, 12)}`;
const password = "SecureTestPassword123!";

let authCookie: string;

describe("Search history API", () => {
  beforeAll(async () => {
    // Create a temporary user for these tests.
    await request(app)
      .post("/users")
      .send({ username, password })
      .expect(201);

    // Log in and save the authentication cookie.
    const login = await request(app)
      .post("/auth/login")
      .send({ username, password })
      .expect(200);

    const cookies = login.headers["set-cookie"] as string[];
    const cookie = cookies.find((value) =>
      value.startsWith("auth_token="),
    );

    if (!cookie) {
      throw new Error("Login did not return an authentication cookie");
    }

    authCookie = cookie.split(";")[0]!;

    // Searching records two entries in the user's history.
    await request(app)
      .get("/titles/search?q=love")
      .set("Cookie", authCookie)
      .expect(200);

    await request(app)
      .get("/titles/search?q=war")
      .set("Cookie", authCookie)
      .expect(200);
  });

  afterAll(async () => {
    // Deleting the test user also deletes their search history.
    await pool.query("DELETE FROM users WHERE username = $1", [username]);
    await pool.end();
  });

  it("rejects search-history access without authentication", async () => {
    const response = await request(app)
      .get("/users/me/search-history")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("lists the user's searches with pagination", async () => {
    const response = await request(app)
      .get("/users/me/search-history?pageSize=1")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].uri).toMatch(
      /^\/users\/me\/search-history\/\d+$/,
    );
    expect(response.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      totalItems: 2,
      next: "/users/me/search-history?page=2&pageSize=1",
    });
  });

  it("retrieves and deletes one entry", async () => {
    const list = await request(app)
      .get("/users/me/search-history")
      .set("Cookie", authCookie)
      .expect(200);

    const uri: string = list.body.items[0].uri;

    const entry = await request(app)
      .get(uri)
      .set("Cookie", authCookie)
      .expect(200);

    expect(entry.body.uri).toBe(uri);

    await request(app).delete(uri).set("Cookie", authCookie).expect(204);
    await request(app).get(uri).set("Cookie", authCookie).expect(404);
  });

  it("rejects an invalid search ID", async () => {
    const response = await request(app)
      .get("/users/me/search-history/abc")
      .set("Cookie", authCookie)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("clears the whole search history", async () => {
    await request(app)
      .delete("/users/me/search-history")
      .set("Cookie", authCookie)
      .expect(204);

    const response = await request(app)
      .get("/users/me/search-history")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
  });
});
