import { Router } from "express";
import {
  clearSearchHistory,
  findSearchHistory,
  findSearchHistoryEntry,
  removeSearchHistoryEntry,
  type SearchHistoryRow,
} from "../data/searchHistory.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { createPagination, parsePagination } from "./paging.js";

export const searchHistoryRouter = Router();

// All search-history endpoints require the user to be logged in.
searchHistoryRouter.use(requireAuth);

// Search IDs are positive integers from the search_log table.
function checkSearchId(value: unknown): number {
  if (typeof value !== "string" || !/^\d{1,9}$/.test(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid searchId");
  }

  return Number(value);
}

// Maps a search_log row to its JSON representation.
function toSearchHistoryDto(row: SearchHistoryRow) {
  return {
    uri: `/users/me/search-history/${row.id}`,
    query: row.search_query,
    searchedAt: row.timestamp,
  };
}

// GET /users/me/search-history?page=1&pageSize=20
// Return the logged-in user's searches, newest first.
searchHistoryRouter.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.pageSize);

    if (!pagination) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid pagination parameters",
      );
    }

    const { page, pageSize } = pagination;
    const result = await findSearchHistory(req.user!.userId, page, pageSize);

    return res.status(200).json({
      items: result.rows.map(toSearchHistoryDto),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/users/me/search-history?page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me/search-history
// Clear the logged-in user's whole search history.
searchHistoryRouter.delete("/", async (req, res, next) => {
  try {
    await clearSearchHistory(req.user!.userId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /users/me/search-history/:searchId
// Return one search-history entry.
searchHistoryRouter.get("/:searchId", async (req, res, next) => {
  try {
    const searchId = checkSearchId(req.params.searchId);
    const entry = await findSearchHistoryEntry(req.user!.userId, searchId);

    if (!entry) {
      throw new ApiError(404, "NOT_FOUND", "Search history entry not found");
    }

    return res.status(200).json(toSearchHistoryDto(entry));
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me/search-history/:searchId
// Delete one search-history entry.
searchHistoryRouter.delete("/:searchId", async (req, res, next) => {
  try {
    const searchId = checkSearchId(req.params.searchId);
    const deleted = await removeSearchHistoryEntry(req.user!.userId, searchId);

    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "Search history entry not found");
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
