import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { pool } from "../src/db.js";

const username = `account-${randomUUID().slice(0, 12)}`;
const renamed = `renamed-${randomUUID().slice(0, 12)}`;
const password = "SecureTestPassword123!";
const newPassword = "AnotherSecurePassword456!";

let authCookie: string;

async function login(name: string, secret: string) {
  return request(app).post("/auth/login").send({
    username: name,
    password: secret,
  });
}

describe("Account management API", () => {
  beforeAll(async () => {
    // Create a temporary user for these tests.
    await request(app)
      .post("/users")
      .send({ username, password })
      .expect(201);

    const response = await login(username, password);
    const cookies = response.headers["set-cookie"] as string[];
    const cookie = cookies.find((value) =>
      value.startsWith("auth_token="),
    );

    if (!cookie) {
      throw new Error("Login did not return an authentication cookie");
    }

    authCookie = cookie.split(";")[0]!;
  });

  afterAll(async () => {
    // Clean up in case a test failed before the account was deleted.
    await pool.query(
      "DELETE FROM users WHERE username = ANY($1)",
      [[username, renamed]],
    );
    await pool.end();
  });

  it("rejects account changes without authentication", async () => {
    await request(app)
      .patch("/users/me")
      .send({ username: renamed })
      .expect(401);
  });

  it("changes the username", async () => {
    const response = await request(app)
      .patch("/users/me")
      .set("Cookie", authCookie)
      .send({ username: renamed })
      .expect(200);

    expect(response.body.username).toBe(renamed);
    expect(response.body.uri).toMatch(/^\/users\/\d+$/);
  });

  it("rejects an invalid username", async () => {
    const response = await request(app)
      .patch("/users/me")
      .set("Cookie", authCookie)
      .send({ username: "x" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a password change with the wrong current password", async () => {
    await request(app)
      .patch("/users/me/password")
      .set("Cookie", authCookie)
      .send({ currentPassword: "wrong-password", newPassword })
      .expect(401);

    // The old password must still work.
    expect((await login(renamed, password)).status).toBe(200);
  });

  it("changes the password", async () => {
    await request(app)
      .patch("/users/me/password")
      .set("Cookie", authCookie)
      .send({ currentPassword: password, newPassword })
      .expect(204);

    expect((await login(renamed, password)).status).toBe(401);
    expect((await login(renamed, newPassword)).status).toBe(200);
  });

  it("deletes the account and clears the cookie", async () => {
    const response = await request(app)
      .delete("/users/me")
      .set("Cookie", authCookie)
      .expect(204);

    const cookies = response.headers["set-cookie"] as string[] | undefined;
    expect(cookies?.some((value) => value.startsWith("auth_token=;"))).toBe(
      true,
    );

    expect((await login(renamed, newPassword)).status).toBe(401);
  });
});
