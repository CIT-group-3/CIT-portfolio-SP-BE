
import { Router } from "express";
import { hashPassword } from "../auth/crypto.js";
import { createUser } from "../data/users.js";
import { ApiError } from "../middleware/errors.js";
import { validateRegistration } from "../validation.js";
import { findUserById } from "../data/users.js";
import { requireAuth } from "../middleware/auth.js";

export const usersRouter = Router();

// POST /users
usersRouter.post("/", async (req, res, next) => {
  try {
    const validation = validateRegistration(req.body);

    if (!validation.data) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid registration data",
        validation.issues,
      );
    }

    const { username, password } = validation.data;

    const passwordHash = await hashPassword(password);

    try {
      const user = await createUser(username, passwordHash);

      return res
        .status(201)
        .location(`/users/${user.id}`)
        .json({
          uri: `/users/${user.id}`,
          username: user.username,
        });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Username is already taken",
        );
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// GET /users/me
usersRouter.get("/me", requireAuth, async (req, res, next) => {
    try {
      const user = await findUserById(req.user!.userId);

      if (!user) {
        throw new ApiError(404, "NOT_FOUND", "User not found");
      }

      return res.status(200).json({
        uri: `/users/${user.id}`,
        username: user.username,
      });
    } catch (error) {
      next(error);
    }
  });