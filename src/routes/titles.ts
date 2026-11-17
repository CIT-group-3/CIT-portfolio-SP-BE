 import { Router } from "express";
 import { findMediaById, findTitles } from "../data/titles.js";
 import { ApiError } from "../middleware/errors.js";
// export const titlesRouter = Router();

// titlesRouter.get("/:id", async (req, res) => {
//   const id = req.params.id;
//   const media = await findMediaById(id);
//   if (!media) {
//     return res.status(404).json({ error: "Media not found" });
//   }
//   const dto = toTitleDto(media);
//   res.json(dto);
// });


// --------------------

import {
  toTitleDto,
  toTitlesListDto,
} from "./dto.js";

import { parsePagination } from "./paging.js";

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