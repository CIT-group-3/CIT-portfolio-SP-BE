import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `auth-${randomUUID().slice(0, 12)}`;
const password = "SecureTestPassword123!";

describe("Authentication API", () => {
  beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE username = $1", [username]);

    await request(app)
      .post("/users")
      .send({ username, password })
      .expect(201);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE username = $1", [username]);
    await pool.end();
  });

  it("logs in and issues an HTTP-only authentication cookie", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ username, password })
      .expect(200);

    expect(response.body).toEqual({
      uri: expect.stringMatching(/^\/users\/\d+$/),
      username,
    });

    const cookies = response.headers["set-cookie"] as string[];

    expect(cookies).toBeDefined();
    expect(cookies.some((cookie) =>
      cookie.includes("auth_token=") && cookie.includes("HttpOnly"),
    )).toBe(true);

    expect(response.body).not.toHaveProperty("token");
  });

  it("rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ username, password: "WrongPassword123!" })
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an unknown username", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: `unknown-${randomUUID().slice(0, 8)}`,
        password,
      })
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects access to the current user without authentication", async () => {
    const response = await request(app)
      .get("/users/me")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows access to the current user after login", async () => {
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ username, password })
      .expect(200);

    const cookies = loginResponse.headers["set-cookie"] as string[];
    const authCookie = cookies.find((cookie) =>
      cookie.startsWith("auth_token="),
    );

    expect(authCookie).toBeDefined();

    const response = await request(app)
      .get("/users/me")
      .set("Cookie", authCookie!.split(";")[0])
      .expect(200);

    expect(response.body).toEqual({
      uri: expect.stringMatching(/^\/users\/\d+$/),
      username,
    });
  });

  it("rejects an invalid authentication cookie", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("Cookie", "auth_token=invalid.token.value")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("clears the authentication cookie on logout", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .expect(200);

    expect(response.body.message).toBe("Logged out successfully");

    const cookies = response.headers["set-cookie"] as string[];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie) =>
        cookie.includes("auth_token=") &&
        cookie.includes("Expires="),
      ),
    ).toBe(true);
  });
});