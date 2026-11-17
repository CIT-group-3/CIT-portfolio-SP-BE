
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
  import { verifyPassword } from "../src/auth/crypto.js";

  const username = `test-${randomUUID()}`;
  const password = "SecureTestPassword123!";

  beforeAll(async () => {
    // Ensure this test starts without an existing test user.
    await pool.query(
      "DELETE FROM users WHERE username = $1",
      [username],
    );
  });

  afterAll(async () => {
    // Remove the test account after all tests.
    await pool.query(
      "DELETE FROM users WHERE username = $1",
      [username],
    );

    await pool.end();
  });

  describe("POST /users", () => {
    it("registers a user and returns its public representation", async () => {
      const response = await request(app)
        .post("/users")
        .send({ username, password });

      expect(response.status).toBe(201);
      expect(response.headers.location).toBe(response.body.uri);
      expect(response.body).toMatchObject({
        uri: expect.stringMatching(/^\/users\/\d+$/),
        username,
      });

      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("password_hash");
    });

    it("stores a password hash rather than the original password", async () => {
      const result = await pool.query<{
        password_hash: string;
      }>(
        "SELECT password_hash FROM users WHERE username = $1",
        [username],
      );

      expect(result.rows).toHaveLength(1);

      const storedHash = result.rows[0]!.password_hash;

      expect(storedHash).not.toBe(password);

      await expect(
        verifyPassword(password, storedHash),
      ).resolves.toBe(true);
    });

    it("rejects a duplicate username", async () => {
      const response = await request(app)
        .post("/users")
        .send({ username, password });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatchObject({
        status: 409,
        code: "CONFLICT",
        message: "Username is already taken",
      });
    });

    it("rejects an invalid username", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          username: "ab",
          password,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a short password", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          username: `short-${randomUUID()}`,
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a request without a JSON object body", async () => {
      const response = await request(app)
        .post("/users")
        .send([]);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
