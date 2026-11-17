import type { RequestHandler } from "express";
import { verifyToken } from "../auth/token.js";
import { ApiError } from "./errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.auth_token;

  if (typeof token !== "string" || token.length === 0) {
    return next(
      new ApiError(401, "UNAUTHORIZED", "Authentication required"),
    );
  }

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId };
    return next();
  } catch {
    return next(
      new ApiError(
        401,
        "UNAUTHORIZED",
        "Invalid or expired authentication token",
      ),
    );
  }
};