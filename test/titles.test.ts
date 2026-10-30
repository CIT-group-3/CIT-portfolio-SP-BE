import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";

afterAll(async () => {
  await pool.end();
});

describe("GET /titles/:id", () => {
  it("returns 200 and the title data for a existing title", async () => {
    const res = await request(app).get("/titles/tt21050232");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({
      url: "/titles/tt21050232",
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

  it("identifies tge recource by URI and not bare id", async () => {
    const res = await request(app).get("/titles/tt21050232");

    expect(res.body.url).toBe("/titles/tt21050232");
    expect(res.body).not.toHaveProperty("id");
  });

  it("returns 404 for a non-existing title", async () => {
    const res = await request(app).get("/titles/tt99999999");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({
      error: "Media not found",
    });
  });
});
