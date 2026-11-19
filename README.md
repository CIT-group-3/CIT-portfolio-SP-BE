# CIT-portfolio-SP-BE

Backend REST API for the RUC Computer Science portfolio project (Subproject 2).

Built with Node.js, TypeScript, Express 5 and PostgreSQL.


## API Overview

The API provides access to IMDb-based title and person data, user accounts, bookmarks, ratings, search functionality, recommendations, and application-managed framework data.

The API distinguishes between read-only IMDb data and application-managed data. IMDb data is read-only, while user and framework data support the relevant create, read, update, and delete operations.

The following table describes the API scope. Each endpoint is marked as implemented or planned to distinguish the current functionality from the remaining project requirements.

| URI | Method | What it does | Status |
|---|---|---|---|
| `/` | GET | API welcome message and documentation location | Implemented |
| `/titles` | GET | Paged list of titles | Implemented |
| `/titles/{id}` | GET | Retrieve one title | Implemented |
| `/titles/{id}/similar` | GET | Retrieve similar movies | Planned |
| `/titles/{id}/popular-actors` | GET | Retrieve popular actors associated with a title | Planned |
| `/titles/{id}/ratings/application` | GET | Retrieve application-level rating statistics for a title | Planned |
| `/people` | GET | Paged list of people | Implemented |
| `/people/search` | GET | Search people by name and record the search in user history | Implemented |
| `/people/{id}` | GET | Retrieve one person | Implemented |
| `/people/{id}/co-players` | GET | Retrieve frequent co-players of a person | Planned |
| `/people/{id}/words` | GET | Retrieve word-frequency information associated with a person's work | Planned |
| `/title-searches` | POST | Search titles using supported search modes | Planned |
| `/users` | POST | Register a new user | Implemented |
| `/users/me` | GET | Retrieve the authenticated user's profile | Implemented |
| `/users/me` | PATCH | Update the authenticated user's profile | Planned |
| `/users/me` | DELETE | Delete the authenticated user's account | Planned |
| `/users/me/password` | PATCH | Change the authenticated user's password | Planned |
| `/auth/login` | POST | Log in and receive an authentication cookie | Implemented |
| `/auth/logout` | POST | Log out and clear the authentication cookie | Implemented |
| `/users/me/bookmarks/media` | GET | List the user's bookmarked titles | Implemented |
| `/users/me/bookmarks/media` | POST | Add a title to the user's bookmarks | Implemented |
| `/users/me/bookmarks/media/{mediaId}` | DELETE | Remove a title from the user's bookmarks | Implemented |
| `/users/me/bookmarks/people` | GET | List the user's bookmarked people | Implemented |
| `/users/me/bookmarks/people` | POST | Add a person to the user's bookmarks | Implemented |
| `/users/me/bookmarks/people/{personId}` | DELETE | Remove a person from the user's bookmarks | Implemented |
| `/users/me/ratings` | GET | Retrieve the user's rating history | Planned |
| `/users/me/ratings` | POST | Create a rating for a title | Planned |
| `/users/me/ratings/{titleId}` | GET | Retrieve the user's rating for a specific title | Planned |
| `/users/me/ratings/{titleId}` | PUT | Update the user's rating for a title | Planned |
| `/users/me/ratings/{titleId}` | DELETE | Delete the user's rating for a title | Planned |
| `/users/me/search-history` | GET | Retrieve the user's search history | Planned |
| `/users/me/search-history/{searchId}` | GET | Retrieve one search-history entry | Planned |
| `/users/me/search-history/{searchId}` | PATCH | Update a search-history entry | Planned |
| `/users/me/search-history/{searchId}` | DELETE | Delete a search-history entry | Planned |

### Title Search Functionality

`POST /title-searches` will support multiple search modes through the request body:

- **Basic search:** Search titles using a text query.
- **Structured search:** Search using structured criteria and filters.
- **Exact search:** Find exact title matches.
- **Best-match search:** Rank results by relevance.
- **Related-words search:** Expand searches using related words.
- **Weighted search:** Rank results using weighted search criteria.

### Person Search Functionality

`GET /people/search` supports searching for people by name using a query parameter.

- Search requires authentication because searches are recorded in the user's search history.
- Results support pagination.
- The endpoint reuses the existing Subproject 1 `string_search_person` database function.

### Additional Functionality

The API will also support:

- User rating history and application-level title rating statistics.
- Search history management.
- Title and person bookmarks.
- Similar-title recommendations.
- Co-player analysis and popular actor retrieval.
- Word-frequency analysis.
- Full CRUD operations for application-managed framework data.

All collection endpoints returning lists will support pagination where applicable. Protected user endpoints will require authentication and operate on the currently authenticated user.

The API design will be extended as implementation progresses. IMDb data will remain read-only, while application-managed data will support the required modifications.

## Installation and setup

### Requirements

- Node.js 22 or newer
- npm
- PostgreSQL access
- Subproject 1 database schema and data

Database project: [CIT-portfolio-SP-DB](https://github.com/CIT-group-3/CIT-portfolio-SP-DB)

### 1. Clone the repository

```bash
git clone https://github.com/CIT-group-3/CIT-portfolio-SP-BE.git
cd CIT-portfolio-SP-BE
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Configure the database connection and application settings in `.env`:

```env
PGHOST=your_host
PGPORT=your_port
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
PORT=3030
JWT_SECRET=your_random_secret
```

Replace the database placeholders with the credentials for your PostgreSQL database.

Generate a secure JWT secret with:

```bash
openssl rand -base64 32
```

Use the generated value for `JWT_SECRET`. It must contain at least 32 characters.

**Important:** Never commit `.env` or share real database credentials or JWT secrets. Each developer should configure their own local environment. `.env.example` contains placeholders only.

### 4. Start the development server

```bash
npm run dev
```

The API will run at:

http://localhost:3030

The port can be changed using the `PORT` environment variable.

## API documentation

Swagger UI is available at:

http://localhost:3030/api-docs

It provides interactive documentation for inspecting and testing the documented endpoints, including their request and response schemas.

## Authentication

Authentication uses JSON Web Tokens (JWT) signed with HS256.

- Passwords are hashed using PBKDF2-SHA256 with a random salt.
- Successful login sets an HTTP-only authentication cookie.
- Protected endpoints use authentication middleware to verify the cookie.
- The JWT signing secret is loaded from the `JWT_SECRET` environment variable.
- The cookie uses `httpOnly`, `sameSite` and a `secure` flag in production.
- The current token lifetime is one hour.

## Pagination

`GET /titles` and `GET /people` support pagination through the following query parameters:
| Parameter | Default | Description |
| --- | ---: | --- |
| `page` | 1 | Requested page number |
| `pageSize` | 20 | Number of titles per page |

Example:

```http
GET /titles?page=1&pageSize=20
```

The response includes the requested page, page size, total item count, total page count, and previous/next page links where applicable.

## Error handling

### Status codes

| Code | Meaning | Used for |
| --- | --- | --- |
| 200 OK | Request succeeded | Successful GET requests and operations returning a response |
| 201 Created | A new resource was created | User registration and future resource creation |
| 204 No Content | Succeeded without a response body | Planned deletion operations |
| 400 Bad Request | Invalid request or input | Invalid pagination, parameters or request bodies |
| 401 Unauthorized | Authentication required or invalid credentials | Protected endpoints and failed login |
| 403 Forbidden | Authenticated user is not allowed | Accessing another user's protected resources |
| 404 Not Found | Resource or endpoint not found | Unknown title, person or route |
| 409 Conflict | Conflict with the current state | Duplicate username and future duplicate-resource checks |
| 500 Internal Server Error | Unexpected server error | Unexpected failures such as database errors |

### Distinctions

- **401 vs 403:** 401 means the user is not authenticated; 403 means the user is authenticated but not authorized.
- **400 vs 404:** 400 means the request is invalid; 404 means the requested resource does not exist.
- **Login failure:** Returns the same generic 401 response for an unknown username or incorrect password, avoiding disclosure of registered usernames.

### Error representation

Errors use a consistent JSON structure:

```json
{
  "error": {
    "status": 404,
    "code": "TITLE_NOT_FOUND",
    "message": "Title was not found"
  }
}
```

### Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | A parameter or body field is missing or invalid |
| `NOT_AUTHENTICATED` | 401 | Missing, invalid or expired token, or wrong login credentials |
| `FORBIDDEN` | 403 | The user may not access this resource |
| `TITLE_NOT_FOUND` | 404 | No title with the given ID |
| `PERSON_NOT_FOUND` | 404 | No person with the given ID |
| `USERNAME_TAKEN` | 409 | The username is already registered |
| `ALREADY_BOOKMARKED` | 409 | The item is already bookmarked by this user |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

Some error codes describe planned functionality and will be implemented alongside their corresponding endpoints.

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with automatic restart |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled application |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run all tests once |

Tests use Vitest and Supertest.

## Project structure

```text
src/
├── auth/          # Password hashing and JWT handling
├── data/          # PostgreSQL data-access modules
├── docs/          # OpenAPI documentation
├── middleware/    # Authentication and error handling
├── routes/        # Express API routes
├── app.ts         # Express application configuration
├── db.ts          # PostgreSQL connection pool
├── index.ts       # Application entry point
└── validation.ts  # Request validation

test/              # API integration tests
```

## Related project

[Subproject 1 – Database](https://github.com/CIT-group-3/CIT-portfolio-SP-DB)
