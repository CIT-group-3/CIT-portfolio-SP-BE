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
import { createPagination, parsePagination } from "./paging.js";

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

// Read page and pageSize from the query string, or reject them.
function requirePagination(page: unknown, pageSize: unknown) {
  const pagination = parsePagination(page, pageSize);

  if (!pagination) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid pagination parameters");
  }

  return pagination;
}

function titleBookmarkUri(mediaId: string): string {
  return `/users/me/bookmarks/media/${encodeURIComponent(mediaId)}`;
}

function personBookmarkUri(personId: string): string {
  return `/users/me/bookmarks/people/${encodeURIComponent(personId)}`;
}

// GET /users/me/bookmarks/media?page=1&pageSize=20
// Return the logged-in user's bookmarked movies and TV shows.
bookmarksRouter.get("/media", async (req, res, next) => {
  try {
    const { page, pageSize } = requirePagination(
      req.query.page,
      req.query.pageSize,
    );
    const result = await findTitleBookmarks(req.user!.userId, page, pageSize);

    return res.status(200).json({
      items: result.rows.map((bookmark) => ({
        uri: titleBookmarkUri(bookmark.media_id),
        title: {
          uri: `/titles/${encodeURIComponent(bookmark.media_id)}`,
          name: bookmark.title,
          type: bookmark.media_type,
        },
        bookmarkedAt: bookmark.timestamp,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) => `/users/me/bookmarks/media?page=${number}&pageSize=${pageSize}`,
      ),
    });
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

    const uri = titleBookmarkUri(mediaId);

    return res
      .status(201)
      .location(uri)
      .json({ uri, title: { uri: `/titles/${encodeURIComponent(mediaId)}` } });
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

// GET /users/me/bookmarks/people?page=1&pageSize=20
// Return the logged-in user's bookmarked people.
bookmarksRouter.get("/people", async (req, res, next) => {
  try {
    const { page, pageSize } = requirePagination(
      req.query.page,
      req.query.pageSize,
    );
    const result = await findPersonBookmarks(req.user!.userId, page, pageSize);

    return res.status(200).json({
      items: result.rows.map((bookmark) => ({
        uri: personBookmarkUri(bookmark.person_id),
        person: {
          uri: `/people/${encodeURIComponent(bookmark.person_id)}`,
          name: bookmark.name,
        },
        bookmarkedAt: bookmark.timestamp,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) => `/users/me/bookmarks/people?page=${number}&pageSize=${pageSize}`,
      ),
    });
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

    const uri = personBookmarkUri(personId);

    return res
      .status(201)
      .location(uri)
      .json({ uri, person: { uri: `/people/${encodeURIComponent(personId)}` } });
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
