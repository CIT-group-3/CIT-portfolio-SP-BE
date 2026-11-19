
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { openApiSpec } from "./docs/openapi.js";
import { titlesRouter } from "./routes/titles.js";
import { usersRouter } from "./routes/users.js";
import { peopleRouter } from "./routes/people.js";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { authRouter } from "./routes/auth.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errors.js";

const corsOrigin = process.env.CORS_ORIGIN;

if (!corsOrigin) {
  throw new Error("CORS_ORIGIN must be set");
}

const app = express();

// Allow requests from the configured frontend and support authentication cookies.
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "CIT Portfolio Group-3 Backend API",
    documentation: "/api-docs",
  });
});

// Cookie parsing must run before authentication middleware.
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/users", usersRouter);
app.use("/users/me/bookmarks", bookmarksRouter);
app.use("/auth", authRouter);
app.use("/titles", titlesRouter);
app.use("/people", peopleRouter);

// Keep these AFTER all registered routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
