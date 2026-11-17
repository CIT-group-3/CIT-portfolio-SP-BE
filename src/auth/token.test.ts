
import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  signToken,
  verifyToken,
} from "./token.js";

describe("JWT authentication tokens", () => {
  it("creates a token that can be verified", () => {
    const token = signToken(42);

    expect(typeof token).toBe("string");

    expect(verifyToken(token)).toEqual({
      userId: 42,
    });
  });

  it("rejects a modified token", () => {
    const token = signToken(42);
    const modifiedToken = `${token.slice(0, -1)}x`;

    expect(() => verifyToken(modifiedToken)).toThrow();
  });

  it("rejects a malformed token", () => {
    expect(() => verifyToken("not-a-jwt")).toThrow();
  });

  it("rejects a token with an invalid user ID", () => {
    const secret = process.env.JWT_SECRET!;

    const token = jwt.sign(
      { userId: -1 },
      secret,
      {
        algorithm: "HS256",
        subject: "-1",
        expiresIn: "1h",
      },
    );

    expect(() => verifyToken(token)).toThrow(
      "Invalid authentication token",
    );
  });
});
