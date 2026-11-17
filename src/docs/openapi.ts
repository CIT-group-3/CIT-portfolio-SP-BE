export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CIT Portfolio Group-3 Backend API",
    version: "1.0.0",
    description:
      "REST API for the CIT Portfolio project, including titles, user registration and JWT-based authentication.",
  },
  tags: [
    { name: "Titles", description: "Browse and retrieve media titles" },
    { name: "Users", description: "User registration and account information" },
    { name: "Authentication", description: "Login and logout operations" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "auth_token",
        description: "HTTP-only JWT authentication cookie",
      },
    },
    schemas: {
      Credentials: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "manualtest" },
          password: { type: "string", example: "ManualTest123!" },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          uri: { type: "string", example: "/users/1" },
          username: { type: "string", example: "manualtest" },
        },
      },
      Title: {
        type: "object",
        properties: {
          uri: { type: "string", example: "/titles/tt0111161" },
          type: { type: "string", example: "movie" },
          title: { type: "string", example: "The Shawshank Redemption" },
          releaseYear: { type: "integer", nullable: true, example: 1994 },
          endYear: { type: "integer", nullable: true, example: null },
          runtime: { type: "integer", nullable: true, example: 142 },
          plot: { type: "string", nullable: true },
          poster: { type: "string", nullable: true },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          totalItems: { type: "integer", example: 1000 },
          totalPages: { type: "integer", example: 50 },
          previous: {
            type: "string",
            nullable: true,
            example: null,
          },
          next: {
            type: "string",
            nullable: true,
            example: "/titles?page=2&pageSize=20",
          },
        },
      },
      TitlesList: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Title" },
          },
          pagination: {
            $ref: "#/components/schemas/Pagination",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              status: { type: "integer" },
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/titles": {
      get: {
        tags: ["Titles"],
        summary: "List media titles",
        description:
          "Returns a paginated list of media titles ordered by ID.",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number (positive integer)",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            description: "Number of titles per page (positive integer)",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of titles",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TitlesList" },
              },
            },
          },
          "400": {
            description: "Invalid pagination parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/titles/{id}": {
      get: {
        tags: ["Titles"],
        summary: "Get a title by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Media identifier",
            schema: { type: "string", example: "tt0111161" },
          },
        ],
        responses: {
          "200": {
            description: "Title details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Title" },
              },
            },
          },
          "404": {
            description: "Title not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/users": {
      post: {
        tags: ["Users"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "201": {
            description: "User successfully registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicUser" },
              },
            },
          },
          "400": { description: "Invalid registration data" },
          "409": { description: "Username already exists" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user information",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicUser" },
              },
            },
          },
          "401": { description: "Authentication required or invalid token" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        description:
          "Authenticates a user and sets an HTTP-only JWT cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful; authentication cookie issued",
            headers: {
              "Set-Cookie": {
                description: "HTTP-only auth_token cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicUser" },
              },
            },
          },
          "400": { description: "Invalid login data" },
          "401": { description: "Invalid username or password" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out",
        description: "Clears the authentication cookie.",
        responses: {
          "200": { description: "Successfully logged out" },
        },
      },
    },
  },
};
