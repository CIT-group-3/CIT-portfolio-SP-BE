import express from "express";
import type { Request, Response } from "express";
import { titlesRouter } from "./routes/titles.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errors.js";

const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "CIT Portfolio Group-3 Backend API" });
});

app.use("/titles", titlesRouter);

// Keep these AFTER all registered routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
