
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CIT Portfolio Group-3 Backend API",
    version: "1.0.0",
    description:
"REST API for the CIT Portfolio project, including titles, people, user registration, JWT authentication, bookmarks and ratings.",
  },
  tags: [
    { name: "Titles", description: "Browse and retrieve media titles" },
    { name: "People", description: "Browse and search people" },
    { name: "Users", description: "User registration and account information" },
    { name: "Authentication", description: "Login and logout operations" },
    { name: "Bookmarks", description: "Manage the authenticated user's media and person bookmarks" },
    { name: "Ratings", description: "Manage the authenticated user's media ratings" },
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
      SimilarMovie: {
        type: "object",
        properties: {
          media_id: { type: "string", example: "tt0111161" },
          title: { type: "string", example: "The Shawshank Redemption" },
          similarity: {
            type: "number",
            example: 0.5,
            description: "Genre similarity score between 0 and 1",
          },
        },
      },
      Person: {
        type: "object",
        properties: {
          uri: { type: "string", example: "/people/nm0000209" },
          name: { type: "string", example: "Tim Robbins" },
          birthYear: { type: "integer", nullable: true, example: 1958 },
          deathYear: { type: "integer", nullable: true, example: null },
        },
      },
      CoPlayer: {
        type: "object",
        properties: {
          uri: { type: "string", example: "/people/nm0000741" },
          name: { type: "string", example: "Tim Allen" },
          frequency: {
            type: "integer",
            example: 2,
            description: "Number of movies shared with the requested actor",
          },
        },
      },
      KnownForTitle: {
        type: "object",
        properties: {
          uri: { type: "string", example: "/titles/tt0111161" },
          title: { type: "string", example: "The Shawshank Redemption" },
          type: { type: "string", example: "movie" },
        },
      },
      PersonDetails: {
        allOf: [
          { $ref: "#/components/schemas/Person" },
          {
            type: "object",
            properties: {
              knownFor: {
                type: "array",
                items: { $ref: "#/components/schemas/KnownForTitle" },
              },
            },
          },
        ],
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
      PeopleList: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Person" },
          },
          pagination: {
            $ref: "#/components/schemas/Pagination",
          },
        },
      },
      PersonSearchList: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                uri: { type: "string", example: "/people/nm0000209" },
                name: { type: "string", example: "Tim Robbins" },
              },
            },
          },
          pagination: {
            $ref: "#/components/schemas/Pagination",
          },
        },
      },
      MediaBookmark: {
        type: "object",
        properties: {
          media_id: { type: "string", example: "tt0111161" },
          title: { type: "string", example: "The Shawshank Redemption" },
          media_type: { type: "string", example: "movie" },
          timestamp: { type: "string", example: "2026-11-18" },
        },
      },
      PersonBookmark: {
        type: "object",
        properties: {
          person_id: { type: "string", example: "nm0000209" },
          name: { type: "string", example: "Tim Robbins" },
          timestamp: { type: "string", example: "2026-11-18" },
        },
      },
      MediaBookmarks: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/MediaBookmark" },
          },
        },
      },
      PersonBookmarks: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PersonBookmark" },
          },
        },
      },
      UserRating: {
        type: "object",
        properties: {
          media_id: { type: "string", example: "tt0111161" },
          title: { type: "string", example: "The Shawshank Redemption" },
          media_type: { type: "string", example: "movie" },
          rating: { type: "integer", minimum: 1, maximum: 10, example: 9 },
          review: { type: "string", nullable: true, example: null },
          timestamp: { type: "string", example: "2026-11-19" },
        },
      },
      UserRatings: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/UserRating" },
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

    "/titles/similar": {
        get: {
          tags: ["Titles"],
          summary: "Find similar movies",
          description:
            "Returns movies with similar genres using the existing SP1 database function. The movie title must match exactly. Results are ordered by similarity, highest first.",
          parameters: [
            {
              name: "title",
              in: "query",
              required: true,
              description: "Exact movie title",
              schema: { type: "string", example: "Let It Ride" },
            },
          ],
          responses: {
            "200": {
              description: "List of similar movies",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SimilarMovie" },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Movie title is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Movie not found",
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

    // People endpoints
    "/people": {
      get: {
        tags: ["People"],
        summary: "List people",
        description: "Returns a paginated list of people.",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of people",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PeopleList" },
              },
            },
          },
          "400": { description: "Invalid pagination parameters" },
        },
      },
    },
    "/people/search": {
      get: {
        tags: ["People"],
        summary: "Search people by name",
        description:
          "Searches people using the existing database search function and records the search in the authenticated user's history.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Name or part of a person's name (1–100 characters)",
            schema: { type: "string", example: "Tim Robbins" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated person search results",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PersonSearchList" },
              },
            },
          },
          "400": { description: "Invalid search or pagination parameters" },
          "401": { description: "Authentication required or invalid token" },
        },
      },
    },
    "/people/coplayers": {
        get: {
          tags: ["People"],
          summary: "Find an actor's co-players",
          description:
            "Returns actors who appeared in movies with the specified actor, ordered by the number of shared movies. The actor name must match exactly and identify one person.",
          parameters: [
            {
              name: "name",
              in: "query",
              required: true,
              description: "Exact actor name (1–100 characters)",
              schema: { type: "string", example: "Tom Hanks" },
            },
          ],
          responses: {
            "200": {
              description: "List of co-players",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CoPlayer" },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid or ambiguous actor name",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Actor not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    "/people/{id}": {
      get: {
        tags: ["People"],
        summary: "Get a person by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "IMDb person identifier",
            schema: { type: "string", example: "nm0000209" },
          },
        ],
        responses: {
          "200": {
            description: "Person details and known-for titles",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PersonDetails" },
              },
            },
          },
          "400": { description: "Invalid person ID" },
          "404": { description: "Person not found" },
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
    "/users/me/bookmarks/media": {
      get: {
        tags: ["Bookmarks"],
        summary: "List the authenticated user's media bookmarks",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of bookmarked media",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MediaBookmarks" },
              },
            },
          },
          "401": { description: "Authentication required or invalid token" },
        },
      },
      post: {
        tags: ["Bookmarks"],
        summary: "Add a media bookmark",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mediaId"],
                properties: {
                  mediaId: { type: "string", example: "tt0111161" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Media bookmark created" },
          "400": { description: "Invalid media ID" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Media not found" },
          "409": { description: "Bookmark already exists" },
        },
      },
    },
    "/users/me/bookmarks/media/{mediaId}": {
      delete: {
        tags: ["Bookmarks"],
        summary: "Remove a media bookmark",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "mediaId",
            in: "path",
            required: true,
            schema: { type: "string", example: "tt0111161" },
          },
        ],
        responses: {
          "204": { description: "Media bookmark removed" },
          "400": { description: "Invalid media ID" },
          "401": { description: "Authentication required or invalid token" },
        },
      },
    },
    "/users/me/bookmarks/people": {
      get: {
        tags: ["Bookmarks"],
        summary: "List the authenticated user's person bookmarks",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of bookmarked people",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PersonBookmarks" },
              },
            },
          },
          "401": { description: "Authentication required or invalid token" },
        },
      },
      post: {
        tags: ["Bookmarks"],
        summary: "Add a person bookmark",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["personId"],
                properties: {
                  personId: { type: "string", example: "nm0000209" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Person bookmark created" },
          "400": { description: "Invalid person ID" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Person not found" },
          "409": { description: "Bookmark already exists" },
        },
      },
    },
    "/users/me/bookmarks/people/{personId}": {
      delete: {
        tags: ["Bookmarks"],
        summary: "Remove a person bookmark",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "personId",
            in: "path",
            required: true,
            schema: { type: "string", example: "nm0000209" },
          },
        ],
        responses: {
          "204": { description: "Person bookmark removed" },
          "400": { description: "Invalid person ID" },
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

    "/users/me/ratings": {
      get: {
        tags: ["Ratings"],
        summary: "List the authenticated user's ratings",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of ratings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserRatings" },
              },
            },
          },
          "401": { description: "Authentication required or invalid token" },
        },
      },
      post: {
        tags: ["Ratings"],
        summary: "Rate a media title",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mediaId", "rating"],
                properties: {
                  mediaId: { type: "string", example: "tt0111161" },
                  rating: { type: "integer", minimum: 1, maximum: 10, example: 9 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Rating successfully created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    mediaId: { type: "string", example: "tt0111161" },
                    rating: { type: "integer", example: 9 },
                    averageRating: { type: "number", nullable: true, example: 9 },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid media ID or rating" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Media not found" },
          "409": { description: "Rating already exists" },
        },
      },
    },
    "/users/me/ratings/{titleId}": {
      get: {
        tags: ["Ratings"],
        summary: "Get the authenticated user's rating for a title",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "titleId",
            in: "path",
            required: true,
            schema: { type: "string", example: "tt0111161" },
          },
        ],
        responses: {
          "200": {
            description: "Rating details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserRating" },
              },
            },
          },
          "400": { description: "Invalid media ID" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Rating not found" },
        },
      },
      put: {
        tags: ["Ratings"],
        summary: "Update the authenticated user's rating",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "titleId",
            in: "path",
            required: true,
            schema: { type: "string", example: "tt0111161" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 10, example: 10 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Rating successfully updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserRating" },
              },
            },
          },
          "400": { description: "Invalid media ID or rating" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Rating not found" },
        },
      },
      delete: {
        tags: ["Ratings"],
        summary: "Delete the authenticated user's rating",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "titleId",
            in: "path",
            required: true,
            schema: { type: "string", example: "tt0111161" },
          },
        ],
        responses: {
          "204": { description: "Rating successfully deleted" },
          "400": { description: "Invalid media ID" },
          "401": { description: "Authentication required or invalid token" },
          "404": { description: "Rating not found" },
        },
      },
    },
  },
};
