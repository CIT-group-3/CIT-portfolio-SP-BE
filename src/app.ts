import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi.js";
import type { Request, Response } from "express";
import { titlesRouter } from "./routes/titles.js";
import { usersRouter } from "./routes/users.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errors.js";
import { authRouter } from "./routes/auth.js";


const app = express();

app.use(express.json());
app.get("/", (_req, res) => {
  res.json({
    message: "CIT Portfolio Group-3 Backend API",
    documentation: "/api-docs",
  });
});
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/titles", titlesRouter);

// Keep these AFTER all registered routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
