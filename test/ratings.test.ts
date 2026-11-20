
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `ratings-${randomUUID().slice(0, 12)}`;
const password = "SecureTestPassword123!";

let authCookie: string;
let mediaId: string;

describe("Ratings API", () => {
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

    // Select an existing title so the tests use a valid media ID.
    const media = await pool.query<{ id: string }>(
      "SELECT id FROM media LIMIT 1",
    );

    if (!media.rows[0]) {
      throw new Error("The database needs at least one media title");
    }

    mediaId = media.rows[0].id;
  });

  afterAll(async () => {
    // Deleting the test user also deletes their ratings.
    await pool.query("DELETE FROM users WHERE username = $1", [username]);
    await pool.end();
  });

  it("rejects rating access without authentication", async () => {
    const response = await request(app)
      .get("/users/me/ratings")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an invalid rating value", async () => {
    const response = await request(app)
      .post("/users/me/ratings")
      .set("Cookie", authCookie)
      .send({ mediaId, rating: 11 })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates and lists a rating", async () => {
    const created = await request(app)
      .post("/users/me/ratings")
      .set("Cookie", authCookie)
      .send({ mediaId, rating: 8 })
      .expect(201);

    expect(created.body.uri).toBe(`/users/me/ratings/${mediaId}`);
    expect(created.headers.location).toBe(`/users/me/ratings/${mediaId}`);
    expect(created.body.rating).toBe(8);

    const response = await request(app)
      .get("/users/me/ratings")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uri: `/users/me/ratings/${mediaId}`,
          rating: 8,
        }),
      ]),
    );
    expect(response.body.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("rejects a duplicate rating", async () => {
    const response = await request(app)
      .post("/users/me/ratings")
      .set("Cookie", authCookie)
      .send({ mediaId, rating: 9 })
      .expect(409);

    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("retrieves one rating", async () => {
    const response = await request(app)
      .get(`/users/me/ratings/${mediaId}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.title.uri).toBe(`/titles/${mediaId}`);
    expect(response.body.rating).toBe(8);
  });

  it("updates an existing rating", async () => {
    const response = await request(app)
      .put(`/users/me/ratings/${mediaId}`)
      .set("Cookie", authCookie)
      .send({ rating: 10 })
      .expect(200);

    expect(response.body.title.uri).toBe(`/titles/${mediaId}`);
    expect(response.body.rating).toBe(10);
  });

  it("deletes an existing rating", async () => {
    await request(app)
      .delete(`/users/me/ratings/${mediaId}`)
      .set("Cookie", authCookie)
      .expect(204);

    const response = await request(app)
      .get(`/users/me/ratings/${mediaId}`)
      .set("Cookie", authCookie)
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects an invalid media ID", async () => {
    const response = await request(app)
      .get("/users/me/ratings/nm0000209")
      .set("Cookie", authCookie)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
