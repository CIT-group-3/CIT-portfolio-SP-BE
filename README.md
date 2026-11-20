# CIT-portfolio-SP-BE

Backend REST API for the RUC Computer Science portfolio project (Subproject 2).

Built with Node.js, TypeScript, Express 5 and PostgreSQL.

## API Overview

The API provides access to IMDb-based title and person data, user accounts, authentication, bookmarks, ratings, search functionality and recommendations.

IMDb data is read-only. Application-managed data, such as user accounts, bookmarks and ratings, supports the relevant create, read, update and delete operations.

The following table describes the current API scope.

| URI | Method | What it does | Status |
|---|---|---|---|
| `/` | GET | API welcome message and documentation location | Implemented |
| `/titles` | GET | Paged list of titles | Implemented |
| `/titles/{id}` | GET | Retrieve one title | Implemented |
| `/titles/search?q={query}` | GET | Search titles by title or plot and record the search in user history | Implemented |
| `/titles/structured-search` | GET | Search titles using title, plot, character and person-name filters | Implemented |
| `/titles/popular-actors?title={title}` | GET | Find actors and actresses credited in an exact title match, ranked by overall IMDb person rating | Implemented |
| `/titles/similar?title={title}` | GET | Find movies similar to a specified movie | Implemented |
| `/people` | GET | Paged list of people | Implemented |
| `/people/search?q={query}` | GET | Search people by name and record the search in user history | Implemented |
| `/people/{id}` | GET | Retrieve one person and known-for titles | Implemented |
| `/people/coplayers?name={name}` | GET | Find actors who appeared in movies with a specified actor | Implemented |
| `/users` | POST | Register a new user | Implemented |
| `/users/me` | GET | Retrieve the authenticated user's profile | Implemented |
| `/users/me` | PATCH | Change the authenticated user's username | Implemented |
| `/users/me` | DELETE | Delete the authenticated user's account | Implemented |
| `/users/me/password` | PATCH | Change the authenticated user's password | Implemented |
| `/auth/login` | POST | Log in and receive an authentication cookie | Implemented |
| `/auth/logout` | POST | Log out and clear the authentication cookie | Implemented |
| `/users/me/bookmarks/media` | GET | List the user's bookmarked titles | Implemented |
| `/users/me/bookmarks/media` | POST | Add a title to the user's bookmarks | Implemented |
| `/users/me/bookmarks/media/{mediaId}` | DELETE | Remove a title from the user's bookmarks | Implemented |
| `/users/me/bookmarks/people` | GET | List the user's bookmarked people | Implemented |
| `/users/me/bookmarks/people` | POST | Add a person to the user's bookmarks | Implemented |
| `/users/me/bookmarks/people/{personId}` | DELETE | Remove a person from the user's bookmarks | Implemented |
| `/users/me/ratings` | GET | Retrieve the user's rating history | Implemented |
| `/users/me/ratings` | POST | Create a rating for a title | Implemented |
| `/users/me/ratings/{titleId}` | GET | Retrieve the user's rating for a specific title | Implemented |
| `/users/me/ratings/{titleId}` | PUT | Update the user's rating for a title | Implemented |
| `/users/me/ratings/{titleId}` | DELETE | Delete the user's rating for a title | Implemented |
| `/people/words?name={name}` | GET | Retrieve word-frequency information associated with a person's work | Implemented |
| `/users/me/search-history` | GET | Retrieve the user's search history | Implemented |
| `/users/me/search-history` | DELETE | Clear the user's search history | Implemented |
| `/users/me/search-history/{searchId}` | GET | Retrieve one search-history entry | Implemented |
| `/users/me/search-history/{searchId}` | DELETE | Delete one search-history entry | Implemented |

### Similar Movies

`GET /titles/similar` accepts a movie title and returns movies ranked by genre similarity. It reuses the existing Subproject 1 `find_similar_movies` database function.

### Co-players

`GET /people/coplayers` accepts an exact actor name and returns other actors ranked by the number of movies they share. It reuses the existing Subproject 1 `find_coplayers` database function.

### Person Search

`GET /people/search` supports searching for people by name.

- Search requires authentication because searches are recorded in the user's search history.
- Results support pagination.
- The endpoint reuses the existing Subproject 1 `string_search_person` database function.

### Title Search

The API provides two authenticated title-search endpoints:

- `GET /titles/search` searches titles and plots using a text query.
- `GET /titles/structured-search` supports optional title, plot, character and person-name filters. At least one filter is required.

Both endpoints reuse existing Subproject 1 database functions and record searches in the authenticated user's search history. Results support pagination.

### Popular Actors

`GET /titles/popular-actors` returns actors and actresses credited in an exact title match, ordered by their overall IMDb person rating. It reuses the Subproject 1 `media_popular_actors` database function. Results support pagination.

The ratings represent each person's overall IMDb rating, not a rating specific to the selected title.

### Ratings and Bookmarks

Authenticated users can manage their own title ratings and title/person bookmarks. Database operations use the authenticated user's ID, so users access their own framework data.

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
JWT_SECRET=replace_with_a_random_secret_of_at_least_32_characters
CORS_ORIGIN=http://localhost:5173
```

Replace the database placeholders with the credentials for your PostgreSQL database.

#### Least-privilege database role

`db/app-role.sql` creates a `cit_app` role that can only do what the API needs. It can read every table, write the framework tables (`users`, bookmarks, `search_log`, `user_rating`), upsert the application rating in `media_rating` through the rating trigger, and execute the SP1 functions. It cannot create, alter, drop or truncate anything.

Run it once as a database administrator, then set `PGUSER=cit_app` and the chosen password in `.env`:

```bash
psql -v app_password='choose-a-password' -f db/app-role.sql
```

The course server account cannot create roles, so on that server the backend connects as the schema owner.

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

The following endpoints support pagination:

- `GET /titles`
- `GET /titles/search`
- `GET /titles/structured-search`
- `GET /titles/popular-actors`
- `GET /people`
- `GET /people/search`

Pagination uses two query parameters:

| Parameter | Default | Description |
|---|---:|---|
| `page` | 1 | Page number, starting at 1 |
| `pageSize` | 20 | Number of results per page (maximum 100) |

Paginated responses include the requested page, page size, total number of items, total number of pages, and links to the previous and next pages when available.

## Error handling

### Status codes

| Code | Meaning | Used for |
|---|---|---|
| 200 OK | Request succeeded | Successful GET requests and operations returning a response |
| 201 Created | A new resource was created | User registration, bookmarks and ratings. Includes a `Location` header with the new resource's URI |
| 204 No Content | Succeeded without a response body | Deleting bookmarks, ratings, search history and the user account; changing the password |
| 400 Bad Request | Invalid request or input | Invalid pagination, parameters or request bodies |
| 401 Unauthorized | Authentication required or invalid credentials | Protected endpoints and failed login |
| 404 Not Found | Resource or endpoint not found | Unknown title, person, rating, search-history entry or route |
| 409 Conflict | Conflict with the current state | Duplicate username, bookmark or rating |
| 500 Internal Server Error | Unexpected server error | Unexpected failures such as database errors |

### Distinctions

- **No 403:** every user-owned resource is addressed through `/users/me`, which always resolves to the authenticated user. A user therefore cannot address another user's data, so the API has no case where an authenticated request is refused with 403.
- **400 vs 404:** 400 means the request is invalid; 404 means the requested resource does not exist.
- **Login failure:** Returns the same generic 401 response for an unknown username or incorrect password, avoiding disclosure of registered usernames.

### Error representation

Errors use a consistent JSON structure:

```json
{
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Title not found"
  }
}
```

### Error codes

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | A path parameter, query parameter or body field is missing or invalid |
| `UNAUTHORIZED` | 401 | Missing, invalid or expired token, wrong login credentials, or wrong current password |
| `NOT_FOUND` | 404 | The resource or route does not exist |
| `CONFLICT` | 409 | The username is taken, or the bookmark or rating already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error. The response never contains stack traces or SQL details |

The `message` field says which resource or rule was involved, so codes are kept coarse-grained. Validation errors from request bodies may also include a `details` array listing each invalid field.

## Development commands

| Command | Description |
|---|---|
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

db/                # SQL for the least-privilege database role
test/              # API integration tests and data-access tests
```

## Related project

[Subproject 1 – Database](https://github.com/CIT-group-3/CIT-portfolio-SP-DB)
