# CIT-portfolio-SP-BE

Backend REST API for the RUC Computer Science portfolio project (Subproject 2).

Built with Node.js, TypeScript, Express 5 and PostgreSQL.

## API design and implementation status

The following table describes the planned API. Endpoints are marked as implemented or planned so that this document remains the reference for the complete project scope.

| URI | Method | What it does | Status |
| --- | --- | --- | --- |
| `/` | GET | API welcome message and documentation location | Implemented |
| `/titles` | GET | Paged list of titles | Implemented |
| `/titles/{id}` | GET | One title | Implemented |
| `/titles/{id}/similar` | GET | Similar movies | Planned |
| `/names/{id}` | GET | One person | Planned |
| `/names/{id}/coplayers` | GET | Frequent co-players | Planned |
| `/search/titles?q=...` | GET | String search | Planned |
| `/users` | POST | Register | Implemented |
| `/users/me` | GET | Get the authenticated user's profile | Implemented |
| `/auth/login` | POST | Log in and receive an authentication cookie | Implemented |
| `/auth/logout` | POST | Log out and clear the authentication cookie | Implemented |
| `/users/{id}/bookmarks` | GET / POST | List or add bookmarks | Planned |
| `/users/{id}/bookmarks/{titleId}` | DELETE | Remove a bookmark | Planned |
| `/titles/{id}/rating` | PUT | Rate a title | Planned |

Additional planned functionality includes rating history, search history, advanced title and person search, popular actors, word frequency, and CRUD operations for framework data. The API design will be extended as implementation progresses.

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

`GET /titles` supports pagination through query parameters:

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
