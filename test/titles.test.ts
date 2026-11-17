import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";

afterAll(async () => {
  await pool.end();
});

describe("GET /titles/:id", () => {
  it("returns 200 and the title data for an existing title", async () => {
    const res = await request(app).get("/titles/tt21050232");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({
      uri: "/titles/tt21050232",
      type: "tvSeries",
      title: "Bugs Bunny Builders",
      releaseYear: 2022,
      endYear: 2025,
      runtime: 11,
      plot: "Join Bugs, Lola, Daffy, Porky and Tweety as they use their wacky vehicles to take on the looniest builds ever. Along the way, they'll learn valuable lessons and never give up because The Looney Builders always get the job done.",
      poster:
        "https://m.media-amazon.com/images/M/MV5BZmEyZTMyNmMtNjk5Mi00MGVjLWE2ZjUtYzM1MzVlMzAzOTRmXkEyXkFqcGc@._V1_SX300.jpg",
    });
  });

  it("identifies the resource by URI and not bare id", async () => {
    const res = await request(app).get("/titles/tt21050232");

    expect(res.body.uri).toBe("/titles/tt21050232");
    expect(res.body).not.toHaveProperty("id");
  });

  it("returns a consistent 404 response for a non-existing title", async () => {
    const res = await request(app).get("/titles/tt99999999");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);

    expect(res.body).toEqual({
      error: {
        status: 404,
        code: "NOT_FOUND",
        message: "Title not found",
      },
    });
  });
});

describe("GET /titles", () => {
  it("returns a paginated list of titles", async () => {
    const res = await request(app).get("/titles?page=1&pageSize=5");

    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBeLessThanOrEqual(5);

    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 5,
    });

    for (const item of res.body.items) {
      expect(item).toHaveProperty("uri");
      expect(item).not.toHaveProperty("id");
    }
  });

  it("rejects invalid pagination parameters", async () => {
    const res = await request(app).get("/titles?page=abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("returns 404 for an unknown route", async () => {
    const res = await request(app).get("/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });
});
