
import type {
    ErrorRequestHandler,
    RequestHandler,
  } from "express";
  
  export class ApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly code: string,
      message: string,
      public readonly details?: unknown,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }
  
  // Handles requests that do not match any registered route.
  export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({
      error: {
        status: 404,
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    });
  };
  
  // Handles errors passed through next(error).
  export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    next,
  ) => {
    if (res.headersSent) {
      return next(error);
    }
  
    if (error instanceof ApiError) {
      return res.status(error.status).json({
        error: {
          status: error.status,
          code: error.code,
          message: error.message,
          ...(error.details === undefined
            ? {}
            : { details: error.details }),
        },
      });
    }
  
    // Log the actual error on the server, never expose its details to clients.
    console.error(error);
  
    return res.status(500).json({
      error: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  };
  