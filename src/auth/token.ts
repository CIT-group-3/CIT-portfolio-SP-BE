// The JWT secret is loaded from the environment rather than
// hardcoded, so it is not exposed in the source repository.

import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

if (JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be configured with at least 32 characters",
  );
}

export interface AuthTokenPayload {
  userId: number;
}

// Creates a signed JWT containing the authenticated user's ID.
// The token expires after one hour.
export function signToken(userId: number): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: 3600,
      subject: String(userId),
    },
  );
}

// Verifies the JWT signature and expiration, then validates
// the claims before trusting the user ID.
export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "number" ||
    !Number.isInteger(payload.userId) ||
    payload.userId <= 0 ||
    payload.sub !== String(payload.userId)
  ) {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: payload.userId,
  };
}
