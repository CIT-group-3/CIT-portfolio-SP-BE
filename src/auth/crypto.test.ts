import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./crypto.js";

describe("password hashing", () => {
  it("accepts the correct password", async () => {
    const hash = await hashPassword("correct-password");

    await expect(
      verifyPassword("correct-password", hash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-password");

    await expect(
      verifyPassword("wrong-password", hash),
    ).resolves.toBe(false);
  });

  it("generates a unique salt for each password hash", async () => {
    const firstHash = await hashPassword("same-password");
    const secondHash = await hashPassword("same-password");

    expect(firstHash).not.toBe(secondHash);
  });

  it("rejects malformed hashes", async () => {
    await expect(
      verifyPassword("password", "not-a-valid-hash"),
    ).resolves.toBe(false);
  });

  it("rejects hashes with modified data", async () => {
    const hash = await hashPassword("correct-password");
    const parts = hash.split("$");

    parts[3] = "invalid";
    const tamperedHash = parts.join("$");

    await expect(
      verifyPassword("correct-password", tamperedHash),
    ).resolves.toBe(false);
  });
});