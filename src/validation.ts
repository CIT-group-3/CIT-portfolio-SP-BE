
export interface RegistrationInput {
    username: string;
    password: string;
  }

  export interface ValidationIssue {
    field: string;
    message: string;
  }

  export function validateRegistration(
    body: unknown,
  ): {
    data?: RegistrationInput;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return {
        issues: [
          {
            field: "body",
            message: "Request body must be a JSON object",
          },
        ],
      };
    }

    const input = body as Record<string, unknown>;

    let username: string | undefined;
    let password: string | undefined;

    if (typeof input.username !== "string") {
      issues.push({
        field: "username",
        message: "Username must be a string",
      });
    } else {
      username = input.username.trim().toLowerCase();

      if (!/^[a-z0-9_.-]{3,50}$/.test(username)) {
        issues.push({
          field: "username",
          message:
            "Username must be 3–50 characters and contain only letters, numbers, dots, underscores or hyphens",
        });
      }
    }

    if (typeof input.password !== "string") {
      issues.push({
        field: "password",
        message: "Password must be a string",
      });
    } else {
      password = input.password;

      if (password.length < 8 || password.length > 128) {
        issues.push({
          field: "password",
          message: "Password must be 8–128 characters long",
        });
      }
    }

    if (issues.length > 0 || username === undefined || password === undefined) {
      return { issues };
    }

    return {
      data: { username, password },
      issues: [],
    };
  }

  export function validateLogin(body: unknown): {
    data?: RegistrationInput;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return {
        issues: [
          { field: "body", message: "Request body must be a JSON object" },
        ],
      };
    }

    const input = body as Record<string, unknown>;

    let username: string | undefined;
    let password: string | undefined;

    if (typeof input.username !== "string") {
      issues.push({
        field: "username",
        message: "Username must be a string",
      });
    } else {
      username = input.username.trim().toLowerCase();

      if (!/^[a-z0-9_.-]{3,50}$/.test(username)) {
        issues.push({
          field: "username",
          message: "Invalid username",
        });
      }
    }

    if (typeof input.password !== "string") {
      issues.push({
        field: "password",
        message: "Password must be a string",
      });
    } else {
      password = input.password;

      if (password.length < 1 || password.length > 128) {
        issues.push({
          field: "password",
          message: "Password must be 1–128 characters long",
        });
      }
    }

    if (issues.length > 0 || username === undefined || password === undefined) {
      return { issues };
    }

    return {
      data: { username, password },
      issues: [],
    };
  }