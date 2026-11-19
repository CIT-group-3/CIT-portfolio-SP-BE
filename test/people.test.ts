
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `people-${randomUUID()}`;
const password = "SecureTestPassword123!";

let cookie: string;
let personId: string;
let personName: string;

beforeAll(async () => {
  // Find an existing person to use in the API tests.
  const personResult = await pool.query<{
    id: string;
    name: string;
  }>(
    `SELECT id, name
     FROM person
     ORDER BY name
     LIMIT 1`,
  );

  if (!personResult.rows[0]) {
    throw new Error("The person table contains no test data");
  }

  personId = personResult.rows[0].id;
  personName = personResult.rows[0].name;

  // Create a temporary user for authenticated search tests.
  await request(app)
    .post("/users")
    .send({ username, password });

  // Log in and save the authentication cookie.
  const login = await request(app)
    .post("/auth/login")
    .send({ username, password });

  cookie = login.headers["set-cookie"]?.[0]?.split(";")[0];

  if (!cookie) {
    throw new Error("Login did not return an authentication cookie");
  }
});

afterAll(async () => {
  // Delete the temporary user and their search history.
  await pool.query(
    "DELETE FROM users WHERE username = $1",
    [username],
  );

  await pool.end();
});

describe("GET /people", () => {
  it("returns a paginated list of people", async () => {
    const response = await request(app)
      .get("/people?page=1&pageSize=5");

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeLessThanOrEqual(5);
    expect(response.body.items[0]).toHaveProperty("uri");
    expect(response.body.items[0]).toHaveProperty("name");
    expect(response.body.pagination).toMatchObject({
      page: 1,
      pageSize: 5,
    });
  });

  it("rejects invalid pagination parameters", async () => {
    const response = await request(app)
      .get("/people?page=invalid");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /people/:id", () => {
  it("returns a person's details and known-for titles", async () => {
    const response = await request(app)
      .get(`/people/${personId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      uri: `/people/${personId}`,
      name: personName,
    });
    expect(response.body).toHaveProperty("knownFor");
    expect(Array.isArray(response.body.knownFor)).toBe(true);
  });

  it("rejects an invalid person ID", async () => {
    const response = await request(app)
      .get("/people/invalid");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /people/search", () => {
  it("requires authentication", async () => {
    const response = await request(app)
      .get("/people/search?q=Tom");

    expect(response.status).toBe(401);
  });

  it("searches people using the authenticated user's account", async () => {
    const response = await request(app)
      .get(`/people/search?q=${encodeURIComponent(personName)}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("uri");
    expect(response.body.items[0]).toHaveProperty("name");
    expect(response.body.pagination.totalItems).toBeGreaterThan(0);

    // Check that the database function recorded the search.
    const history = await pool.query(
      `SELECT id
       FROM search_log
       WHERE user_id = (
         SELECT id FROM users WHERE username = $1
       )
       AND search_query = $2`,
      [username, personName],
    );

    expect(history.rows.length).toBeGreaterThan(0);
  });

  it("rejects an empty search query", async () => {
    const response = await request(app)
      .get("/people/search?q=")
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
