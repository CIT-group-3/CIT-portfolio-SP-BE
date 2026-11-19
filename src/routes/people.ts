
import { Router } from "express";
import {
  findPeople,
  findPersonById,
  findPersonKnownFor,
  searchPeople,
} from "../data/people.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { parsePagination } from "./paging.js";

export const peopleRouter = Router();

// Creates the same pagination information for people lists and searches.
function createPagination(
  page: number,
  pageSize: number,
  totalItems: number,
  pageUri: (pageNumber: number) => string,
) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const validPage = page <= totalPages;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    previous: validPage && page > 1 ? pageUri(page - 1) : null,
    next: validPage && page < totalPages ? pageUri(page + 1) : null,
  };
}

// GET /people?page=1&pageSize=20
peopleRouter.get("/", async (req, res, next) => {
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
      );
    }

    const { page, pageSize } = pagination;
    const result = await findPeople(page, pageSize);

    return res.json({
      items: result.rows.map((person) => ({
        uri: `/people/${encodeURIComponent(person.id)}`,
        name: person.name,
        birthYear: person.birth_year,
        deathYear: person.death_year,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) => `/people?page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    next(error);
  }
});

// GET /people/search?q=Christopher&page=1&pageSize=20
// Login is required because searches are recorded in user history.
peopleRouter.get("/search", requireAuth, async (req, res, next) => {
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

    const result = await searchPeople(
      req.user!.userId,
      search,
      page,
      pageSize,
    );

    return res.json({
      items: result.items.map((person) => ({
        uri: `/people/${encodeURIComponent(person.person_id)}`,
        name: person.name,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/people/search?q=${encodeURIComponent(search)}&page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    next(error);
  }
});

// GET /people/:id
peopleRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!/^nm\d{1,8}$/.test(id)) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid person ID",
      );
    }

    const person = await findPersonById(id);

    if (!person) {
      throw new ApiError(404, "NOT_FOUND", "Person not found");
    }

    const knownFor = await findPersonKnownFor(id);

    return res.json({
      uri: `/people/${encodeURIComponent(person.id)}`,
      name: person.name,
      birthYear: person.birth_year,
      deathYear: person.death_year,
      knownFor: knownFor.map((title) => ({
        uri: `/titles/${encodeURIComponent(title.id)}`,
        title: title.title,
        type: title.media_type,
      })),
    });
  } catch (error) {
    next(error);
  }
});
