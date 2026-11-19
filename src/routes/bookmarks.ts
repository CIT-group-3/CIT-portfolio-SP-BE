import { Router } from "express";
import {
  addPersonBookmark,
  addTitleBookmark,
  findPersonBookmarks,
  findTitleBookmarks,
  removePersonBookmark,
  removeTitleBookmark,
} from "../data/bookmarks.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";

export const bookmarksRouter = Router();

// All bookmark endpoints require the user to be logged in.
bookmarksRouter.use(requireAuth);

// Check that an ID is a valid IMDb ID.
// Media IDs start with "tt", while person IDs start with "nm".
function checkId(value: unknown, prefix: "tt" | "nm", field: string): string {
  if (typeof value !== "string" || !new RegExp(`^${prefix}\\d{1,8}$`).test(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `Invalid ${field}`);
  }

  return value;
}

// Convert common database errors into HTTP errors.
function handleDbError(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;

    if (code === "23505") {
      throw new ApiError(409, "CONFLICT", "Bookmark already exists");
    }

    if (code === "23503") {
      throw new ApiError(404, "NOT_FOUND", "Media or person not found");
    }
  }

  // Pass unexpected errors to the normal error handler.
  throw error;
}

// GET /users/me/bookmarks/media
// Return the logged-in user's bookmarked movies and TV shows.
bookmarksRouter.get("/media", async (req, res, next) => {
  try {
    const bookmarks = await findTitleBookmarks(req.user!.userId);
    return res.status(200).json({ items: bookmarks });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/bookmarks/media
// Add a movie or TV show to the logged-in user's bookmarks.
bookmarksRouter.post("/media", async (req, res, next) => {
  try {
    const mediaId = checkId(req.body?.mediaId, "tt", "mediaId");

    try {
      await addTitleBookmark(req.user!.userId, mediaId);
    } catch (error) {
      handleDbError(error);
    }

    return res.status(201).json({ mediaId });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me/bookmarks/media/:mediaId
// Remove a movie or TV show from the logged-in user's bookmarks.
bookmarksRouter.delete("/media/:mediaId", async (req, res, next) => {
  try {
    const mediaId = checkId(req.params.mediaId, "tt", "mediaId");

    await removeTitleBookmark(req.user!.userId, mediaId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /users/me/bookmarks/people
// Return the logged-in user's bookmarked people.
bookmarksRouter.get("/people", async (req, res, next) => {
  try {
    const bookmarks = await findPersonBookmarks(req.user!.userId);
    return res.status(200).json({ items: bookmarks });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/bookmarks/people
// Add a person to the logged-in user's bookmarks.
bookmarksRouter.post("/people", async (req, res, next) => {
  try {
    const personId = checkId(req.body?.personId, "nm", "personId");

    try {
      await addPersonBookmark(req.user!.userId, personId);
    } catch (error) {
      handleDbError(error);
    }

    return res.status(201).json({ personId });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me/bookmarks/people/:personId
// Remove a person from the logged-in user's bookmarks.
bookmarksRouter.delete("/people/:personId", async (req, res, next) => {
  try {
    const personId = checkId(req.params.personId, "nm", "personId");

    await removePersonBookmark(req.user!.userId, personId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
