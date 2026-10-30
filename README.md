# CIT-portfolio-SP-BE

## API design

| URI                               | Method     | What it does          | Status codes       |
| --------------------------------- | ---------- | --------------------- | ------------------ |
| `/titles`                         | GET        | Paged list of titles  | 200, 400           |
| `/titles/{id}`                    | GET        | One title             | 200, 404           |
| `/titles/{id}/similar`            | GET        | Similar movies        | 200, 404           |
| `/names/{id}`                     | GET        | One person            | 200, 404           |
| `/names/{id}/coplayers`           | GET        | Frequent co-players   | 200, 404           |
| `/search/titles?q=...`            | GET        | String search         | 200, 400, 401      |
| `/users`                          | POST       | Register              | 201, 400, 409      |
| `/auth/login`                     | POST       | Log in, get a token   | 200, 401           |
| `/users/{id}/bookmarks`           | GET / POST | List or add bookmarks | 200, 201, 401, 403 |
| `/users/{id}/bookmarks/{titleId}` | DELETE     | Remove a bookmark     | 204, 401, 403, 404 |
| `/titles/{id}/rating`             | PUT        | Rate a title          | 200, 400, 401      |

## Error handling

### Status codes

#### Success

| Code           | Meaning                          | Used for                                                                                 |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| 200 OK         | Request succeeded, body returned | Every successful GET; PUT that returns the updated resource (e.g. a rating)              |
| 201 Created    | A new resource was created       | POST `/users`, POST a bookmark. Includes a `Location` header with the new resource's URI |
| 204 No Content | Succeeded, nothing to return     | DELETE a bookmark, DELETE a user                                                         |

#### Client errors

| Code             | Meaning                                                    | Used for                                                                                       |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 400 Bad Request  | The request is malformed or invalid                        | Invalid `page`/`pageSize`, missing search query, rating outside 1–10, missing fields in a body |
| 401 Unauthorized | Not logged in, or the token is missing, invalid or expired | Any protected endpoint without a valid token; wrong username/password at login                 |
| 403 Forbidden    | Logged in, but not allowed                                 | User A accessing `/users/B/bookmarks`                                                          |
| 404 Not Found    | The resource doesn't exist                                 | Unknown title or person ID, unknown route, deleting a bookmark that doesn't exist              |
| 409 Conflict     | Conflicts with the current state                           | Username already taken, bookmarking something already bookmarked                               |

#### Server errors

| Code                      | Meaning                    | Used for                                                                        |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| 500 Internal Server Error | Something unexpected broke | Anything not anticipated, such as the database being down. Generic message only |

### Distinctions

- **401 vs 403:** 401 means "who are you?", 403 means "we know who you are, but you're not allowed."
- **400 vs 404:** an ID in the wrong format (e.g. `/titles/abc!!`) is 400; a correctly formatted ID that doesn't exist (e.g. `/titles/tt9999999`) is 404.
- **Login failure** returns 401 with the same message whether the username or the password was wrong, so the API doesn't reveal which usernames exist.

### Error representation

All errors use the same JSON shape:

```json
{
  "error": {
    "status": 404,
    "code": "TITLE_NOT_FOUND",
    "message": "Title tt9999999 was not found"
  }
}
```

### Error codes

| Code                 | Status | Meaning                                                       |
| -------------------- | ------ | ------------------------------------------------------------- |
| `VALIDATION_FAILED`  | 400    | A parameter or body field is missing or invalid               |
| `NOT_AUTHENTICATED`  | 401    | Missing, invalid or expired token, or wrong login credentials |
| `FORBIDDEN`          | 403    | The user may not access this resource                         |
| `TITLE_NOT_FOUND`    | 404    | No title with the given ID                                    |
| `PERSON_NOT_FOUND`   | 404    | No person with the given ID                                   |
| `USERNAME_TAKEN`     | 409    | The username is already registered                            |
| `ALREADY_BOOKMARKED` | 409    | The item is already bookmarked by this user                   |
| `INTERNAL_ERROR`     | 500    | Unexpected server error                                       |

Source: [restfulapi.net – HTTP Status Codes](https://restfulapi.net/http-status-codes/)
