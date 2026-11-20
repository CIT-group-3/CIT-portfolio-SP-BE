
import { Router } from "express";
import {
  findMediaById,
  findTitles,
  findSimilarMovies,
  searchTitles,
  searchStructuredTitles,
  findPopularActors,
} from "../data/titles.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import {
  toTitleDto,
  toTitlesListDto,
} from "./dto.js";
import { createPagination, parsePagination } from "./paging.js";

export const titlesRouter = Router();

// GET /titles?page=1&pageSize=20
titlesRouter.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(
      req.query.page,
      req.query.pageSize,
    );

    if (!pagination) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid pagination parameters",
        [
          {
            field: "page",
            message: "Page and pageSize must be positive integers",
          },
        ],
      );
    }

    const { page, pageSize } = pagination;
    const result = await findTitles(page, pageSize);

    const response = toTitlesListDto(
      result.rows,
      page,
      pageSize,
      result.totalItems,
    );

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /titles/search?q=matrix&page=1&pageSize=20
// Login is required because searches are recorded in user history.
titlesRouter.get("/search", requireAuth, async (req, res, next) => {
  try {
    const searchValue = req.query.q;

    if (
      typeof searchValue !== "string" ||
      searchValue.trim().length === 0 ||
      searchValue.trim().length > 100
    ) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Search query must contain between 1 and 100 characters",
      );
    }

    const search = searchValue.trim();

    const pagination = parsePagination(
      req.query.page,
      req.query.pageSize,
    );

    if (!pagination) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid pagination parameters",
      );
    }

    const { page, pageSize } = pagination;

    const result = await searchTitles(
      req.user!.userId,
      search,
      page,
      pageSize,
    );

    return res.json({
      items: result.items.map((title) => ({
        uri: `/titles/${encodeURIComponent(title.media_id)}`,
        title: title.title,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/titles/search?q=${encodeURIComponent(search)}&page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    next(error);
  }
});

// GET /titles/structured-search?title=Matrix&personNames=Keanu
// All supplied filters must match. At least one filter is required.
titlesRouter.get(
  "/structured-search",
  requireAuth,
  async (req, res, next) => {
    try {
      // Read and validate the optional search filters.
      const filterNames = [
        "title",
        "plot",
        "characters",
        "personNames",
      ] as const;

      const filters: Record<string, string | null> = {};

      for (const name of filterNames) {
        const value = req.query[name];

        if (value === undefined) {
          filters[name] = null;
          continue;
        }

        if (typeof value !== "string" || value.trim().length === 0) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            `Invalid ${name} search filter`,
          );
        }

        const cleanedValue = value.trim();

        if (cleanedValue.length > 255) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            `${name} must not exceed 255 characters`,
          );
        }

        filters[name] = cleanedValue;
      }

      // Avoid returning the entire database when no filters are supplied.
      if (!filterNames.some((name) => filters[name] !== null)) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "At least one search filter is required",
        );
      }

      const pagination = parsePagination(
        req.query.page,
        req.query.pageSize,
      );

      if (!pagination) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Invalid pagination parameters",
        );
      }

      const { page, pageSize } = pagination;

      const result = await searchStructuredTitles(
        req.user!.userId,
        filters.title ?? null,
        filters.plot ?? null,
        filters.characters ?? null,
        filters.personNames ?? null,
        page,
        pageSize,
      );

      // Preserve the supplied filters in pagination links.
      const filterQuery = new URLSearchParams();

      for (const name of filterNames) {
        const value = filters[name];

        if (value !== null) {
          filterQuery.set(name, value ?? "");
        }
      }

      return res.json({
        items: result.items.map((title) => ({
          uri: `/titles/${encodeURIComponent(title.media_id)}`,
          title: title.title,
        })),
        pagination: createPagination(
          page,
          pageSize,
          result.totalItems,
          (number) =>
            `/titles/structured-search?${filterQuery.toString()}&page=${number}&pageSize=${pageSize}`,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /titles/popular-actors?title=The%20Matrix&page=1&pageSize=10
titlesRouter.get("/popular-actors", async (req, res, next) => {
  try {
    const title = req.query.title;

    if (
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.trim().length > 255
    ) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Title must contain between 1 and 255 characters",
      );
    }

    const pagination = parsePagination(
      req.query.page,
      req.query.pageSize,
    );

    if (!pagination) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid pagination parameters",
      );
    }

    const { page, pageSize } = pagination;
    const searchTitle = title.trim();

    const result = await findPopularActors(
      searchTitle,
      page,
      pageSize,
    );

    return res.json({
      items: result.items.map((actor) => ({
        uri: `/people/${encodeURIComponent(actor.person_id)}`,
        name: actor.name,
        rating: actor.rating,
        numberOfVotes: actor.number_of_votes,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/titles/popular-actors?title=${encodeURIComponent(searchTitle)}&page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    next(error);
  }
});

// GET /titles/similar?title=Lost in Liberia
titlesRouter.get("/similar", async (req, res, next) => {
  try {
    const title = req.query.title;

    if (typeof title !== "string" || !title.trim()) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "A movie title is required",
      );
    }

    const pagination = parsePagination(
      req.query.page,
      req.query.pageSize,
    );

    if (!pagination) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid pagination parameters",
      );
    }

    const { page, pageSize } = pagination;
    const movieTitle = title.trim();
    const result = await findSimilarMovies(movieTitle, page, pageSize);

    return res.json({
      items: result.rows.map((movie) => ({
        uri: `/titles/${encodeURIComponent(movie.media_id)}`,
        title: movie.title,
        similarity: movie.similarity,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/titles/similar?title=${encodeURIComponent(movieTitle)}&page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P0001"
    ) {
      return next(new ApiError(404, "NOT_FOUND", "Movie not found"));
    }

    next(error);
  }
});

// GET /titles/:id
titlesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const media = await findMediaById(id);

    if (!media) {
      throw new ApiError(404, "NOT_FOUND", "Title not found");
    }

    return res.json(toTitleDto(media));
  } catch (error) {
    next(error);
  }
});
