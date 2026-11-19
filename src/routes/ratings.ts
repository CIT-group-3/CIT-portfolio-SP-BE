
import { Router } from "express";
import {
  addUserRating,
  findUserRating,
  findUserRatings,
  removeUserRating,
  updateUserRating,
} from "../data/ratings.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";

export const ratingsRouter = Router();

// All rating endpoints require the user to be logged in.
ratingsRouter.use(requireAuth);

// Check that the media ID has the expected IMDb format.
function checkMediaId(value: unknown): string {
  if (typeof value !== "string" || !/^tt\d{1,8}$/.test(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid mediaId");
  }

  return value;
}

// Ratings must be whole numbers from 1 to 10.
function checkRating(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 1 ||
    (value as number) > 10
  ) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Rating must be an integer from 1 to 10",
    );
  }

  return value as number;
}

// Convert common database errors into HTTP errors.
function handleDbError(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;

    if (code === "23505") {
      throw new ApiError(409, "CONFLICT", "You have already rated this title");
    }

    if (code === "23503") {
      throw new ApiError(404, "NOT_FOUND", "Media not found");
    }
  }

  throw error;
}

// GET /users/me/ratings
// Return all ratings belonging to the logged-in user.
ratingsRouter.get("/", async (req, res, next) => {
  try {
    const ratings = await findUserRatings(req.user!.userId);
    return res.status(200).json({ items: ratings });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/ratings
// Add a rating for a movie or TV show.
ratingsRouter.post("/", async (req, res, next) => {
  try {
    const mediaId = checkMediaId(req.body?.mediaId);
    const rating = checkRating(req.body?.rating);

    const averageRating = await addUserRating(
      req.user!.userId,
      mediaId,
      rating,
    );

    return res.status(201).json({
      mediaId,
      rating,
      averageRating,
    });
  } catch (error) {
    try {
      handleDbError(error);
    } catch (handledError) {
      next(handledError);
    }
  }
});

// GET /users/me/ratings/:titleId
// Return one rating belonging to the logged-in user.
ratingsRouter.get("/:titleId", async (req, res, next) => {
  try {
    const mediaId = checkMediaId(req.params.titleId);
    const rating = await findUserRating(req.user!.userId, mediaId);

    if (!rating) {
      throw new ApiError(404, "NOT_FOUND", "Rating not found");
    }

    return res.status(200).json(rating);
  } catch (error) {
    next(error);
  }
});

// PUT /users/me/ratings/:titleId
// Update the logged-in user's rating for a title.
ratingsRouter.put("/:titleId", async (req, res, next) => {
  try {
    const mediaId = checkMediaId(req.params.titleId);
    const rating = checkRating(req.body?.rating);

    const updated = await updateUserRating(
      req.user!.userId,
      mediaId,
      rating,
    );

    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "Rating not found");
    }

    const updatedRating = await findUserRating(req.user!.userId, mediaId);

    return res.status(200).json(updatedRating);
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me/ratings/:titleId
// Delete the logged-in user's rating for a title.
ratingsRouter.delete("/:titleId", async (req, res, next) => {
  try {
    const mediaId = checkMediaId(req.params.titleId);
    const deleted = await removeUserRating(req.user!.userId, mediaId);

    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "Rating not found");
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
