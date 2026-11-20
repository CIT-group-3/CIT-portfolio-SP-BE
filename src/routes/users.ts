
import { Router } from "express";
import { hashPassword, verifyPassword } from "../auth/crypto.js";
import {
  createUser,
  deleteUser,
  findUserById,
  replacePasswordHash,
  updateUsername,
} from "../data/users.js";
import { ApiError } from "../middleware/errors.js";
import {
  validatePasswordChange,
  validateRegistration,
  validateUsernameUpdate,
} from "../validation.js";
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

// PATCH /users/me
// Change the authenticated user's username.
usersRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const validation = validateUsernameUpdate(req.body);

    if (!validation.data) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid user data",
        validation.issues,
      );
    }

    try {
      const user = await updateUsername(
        req.user!.userId,
        validation.data.username,
      );

      if (!user) {
        throw new ApiError(404, "NOT_FOUND", "User not found");
      }

      return res.status(200).json({
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
        throw new ApiError(409, "CONFLICT", "Username is already taken");
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me/password
// Change the password. The current password must be supplied.
usersRouter.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const validation = validatePasswordChange(req.body);

    if (!validation.data) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid password data",
        validation.issues,
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Hash before the transaction so the row lock is held briefly.
    const newPasswordHash = await hashPassword(newPassword);

    const changed = await replacePasswordHash(
      req.user!.userId,
      (storedHash) => verifyPassword(currentPassword, storedHash),
      newPasswordHash,
    );

    if (changed === undefined) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    if (!changed) {
      throw new ApiError(401, "UNAUTHORIZED", "Current password is incorrect");
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me
// Delete the authenticated user's account and log them out.
usersRouter.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await deleteUser(req.user!.userId);

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
