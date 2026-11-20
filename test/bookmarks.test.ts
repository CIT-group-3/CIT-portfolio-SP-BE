import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `bookmarks-${randomUUID().slice(0, 12)}`;
const password = "SecureTestPassword123!";

let authCookie: string;
let mediaId: string;
let personId: string;

describe("Bookmarks API", () => {
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

    // Select existing records so the tests use valid database IDs.
    const media = await pool.query<{ id: string }>(
      "SELECT id FROM media LIMIT 1",
    );

    const person = await pool.query<{ id: string }>(
      "SELECT id FROM person LIMIT 1",
    );

    if (!media.rows[0] || !person.rows[0]) {
      throw new Error("The database needs at least one media and one person");
    }

    mediaId = media.rows[0].id;
    personId = person.rows[0].id;
  });

  afterAll(async () => {
    // Deleting the test user also deletes their bookmarks.
    await pool.query("DELETE FROM users WHERE username = $1", [username]);
    await pool.end();
  });

  it("rejects bookmark access without authentication", async () => {
    const response = await request(app)
      .get("/users/me/bookmarks/media")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("adds and lists a media bookmark", async () => {
    await request(app)
      .post("/users/me/bookmarks/media")
      .set("Cookie", authCookie)
      .send({ mediaId })
      .expect(201);

    const response = await request(app)
      .get("/users/me/bookmarks/media")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: `/users/me/bookmarks/media/${mediaId}` }),
      ]),
    );
    expect(response.body.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("rejects invalid bookmark pagination parameters", async () => {
    const response = await request(app)
      .get("/users/me/bookmarks/media?page=0")
      .set("Cookie", authCookie)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid media ID", async () => {
    const response = await request(app)
      .post("/users/me/bookmarks/media")
      .set("Cookie", authCookie)
      .send({ mediaId: personId })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a duplicate media bookmark", async () => {
    const response = await request(app)
      .post("/users/me/bookmarks/media")
      .set("Cookie", authCookie)
      .send({ mediaId })
      .expect(409);

    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("removes a media bookmark", async () => {
    await request(app)
      .delete(`/users/me/bookmarks/media/${mediaId}`)
      .set("Cookie", authCookie)
      .expect(204);

    const response = await request(app)
      .get("/users/me/bookmarks/media")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: `/users/me/bookmarks/media/${mediaId}` }),
      ]),
    );
  });

  it("adds and lists a person bookmark", async () => {
    await request(app)
      .post("/users/me/bookmarks/people")
      .set("Cookie", authCookie)
      .send({ personId })
      .expect(201);

    const response = await request(app)
      .get("/users/me/bookmarks/people")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: `/users/me/bookmarks/people/${personId}` }),
      ]),
    );
  });

  it("rejects a media ID when adding a person bookmark", async () => {
    const response = await request(app)
      .post("/users/me/bookmarks/people")
      .set("Cookie", authCookie)
      .send({ personId: mediaId })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("removes a person bookmark", async () => {
    await request(app)
      .delete(`/users/me/bookmarks/people/${personId}`)
      .set("Cookie", authCookie)
      .expect(204);

    const response = await request(app)
      .get("/users/me/bookmarks/people")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: `/users/me/bookmarks/people/${personId}` }),
      ]),
    );
  });
});
