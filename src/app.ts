import express from "express";
import type { Request, Response } from "express";
import { titlesRouter } from "./routes/titles.js";

const app = express();
app.use(express.json());

app.use("/titles", titlesRouter);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express" });
});

export default app;
