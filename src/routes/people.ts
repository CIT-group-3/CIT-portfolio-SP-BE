
import { Router } from "express";
import {
  findPeople,
  findPersonById,
  findPersonKnownFor,
  searchPeople,
  findCoPlayers,
  findPersonWords,
} from "../data/people.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { createPagination, parsePagination } from "./paging.js";

export const peopleRouter = Router();

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

// GET /people/coplayers?name=Tom%20Hanks
// Finds actors who appeared in movies with the specified actor.
peopleRouter.get("/coplayers", async (req, res, next) => {
  try {
    const name = req.query.name;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 100
    ) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Actor name must contain between 1 and 100 characters",
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
    const actorName = name.trim();
    const result = await findCoPlayers(actorName, page, pageSize);

    return res.json({
      items: result.rows.map((actor) => ({
        uri: `/people/${encodeURIComponent(actor.nconst)}`,
        name: actor.primaryname,
        frequency: actor.frequency,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/people/coplayers?name=${encodeURIComponent(actorName)}&page=${number}&pageSize=${pageSize}`,
      ),
    });
  } catch (error) {
    // The SP1 function uses PostgreSQL error P0001 for missing
    // actors and ambiguous actor names.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P0001"
    ) {
      const message =
        "message" in error && typeof error.message === "string"
          ? error.message
          : "";

      if (message.includes("not found")) {
        return next(
          new ApiError(404, "NOT_FOUND", "Actor not found"),
        );
      }

      if (message.includes("ambiguous")) {
        return next(
          new ApiError(
            400,
            "VALIDATION_ERROR",
            "Actor name is ambiguous; provide a more specific name",
          ),
        );
      }
    }

    next(error);
  }
});

// GET /people/words?name=Tom%20Hanks
// Lists the words most associated with a person's titles, by frequency.
peopleRouter.get("/words", async (req, res, next) => {
  try {
    const name = req.query.name;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 100
    ) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Person name must contain between 1 and 100 characters",
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
    const personName = name.trim();
    const result = await findPersonWords(personName, page, pageSize);

    return res.json({
      items: result.rows.map((row) => ({
        word: row.word,
        frequency: row.frequency,
      })),
      pagination: createPagination(
        page,
        pageSize,
        result.totalItems,
        (number) =>
          `/people/words?name=${encodeURIComponent(personName)}&page=${number}&pageSize=${pageSize}`,
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
