import { Router } from "express";
import { findMediaById } from "../data/titles.js";
import { toTitleDto } from "./dto.js";

export const titlesRouter = Router();

titlesRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const media = await findMediaById(id);
  if (!media) {
    return res.status(404).json({ error: "Media not found" });
  }
  const dto = toTitleDto(media);
  res.json(dto);
});
