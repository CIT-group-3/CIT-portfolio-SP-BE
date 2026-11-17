import { Router } from "express";
import { verifyPassword } from "../auth/crypto.js";
import { signToken } from "../auth/token.js";
import { findUserByUsername } from "../data/users.js";
import { ApiError } from "../middleware/errors.js";
import { validateLogin } from "../validation.js";

export const authRouter = Router();

// POST /auth/login
authRouter.post("/login", async (req, res, next) => {
  try {
    const validation = validateLogin(req.body);

    if (!validation.data) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid login data",
        validation.issues,
      );
    }

    const { username, password } = validation.data;
    const user = await findUserByUsername(username);

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Invalid username or password",
      );
    }

    const token = signToken(user.id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      uri: `/users/${user.id}`,
      username: user.username,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
authRouter.post("/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });