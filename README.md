# Eventsmister

Eventsmister is a FastAPI backend for a social media-style event discovery app
focused on London events. Users can register, log in, create and browse event
posts, comment on posts, like posts or comments, search for users, and view a
user's posts.

## Tech Stack

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Passlib and bcrypt for password hashing
- python-jose for JWT access tokens
- Pytest

## Project Structure

```text
app/
  auth.py              Password hashing and JWT creation
  database.py          SQLite database connection and SQLAlchemy setup
  dependencies.py      Database and authentication dependencies
  main.py              FastAPI app setup and router registration
  models.py            SQLAlchemy models for users, posts, comments, and likes
  schemas.py           Pydantic request and response schemas
  routers/
    auth.py            Register and login routes
    comments.py        Comment creation, listing, and deletion routes
    likes.py           Post and comment like/unlike routes
    posts.py           Event post routes
    users.py           User lookup, search, and user post routes

tests/
  conftest.py          Shared pytest fixtures
  database_setup.py    In-memory test database and FastAPI test client setup
  test_auth.py         Authentication tests
  test_commets.py      Comment route tests
  test_likes.py        Like route tests
  test_posts.py        Post route tests
  test_users.py        User route tests
```

## Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run the App

Start the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API docs are available at:

```text
http://127.0.0.1:8000/docs
```

## Authentication

Protected routes require a bearer token in the `Authorization` header:

```text
Authorization: Bearer <access_token>
```

Register a user:

```http
POST /auth/register
```

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123!"
}
```

Log in and receive an access token:

```http
POST /auth/login
```

```json
{
  "username": "testuser",
  "password": "Password123!"
}
```

## API Routes

### Root

```http
GET /
```

Returns a welcome message.

### Posts

```http
GET /posts/
POST /posts/
GET /posts/{post_id}
DELETE /posts/{post_id}
```

Creating and deleting posts requires authentication. Users can only delete
their own posts.

Example create post request:

```json
{
  "title": "Jazz Night in Camden",
  "description": "Live jazz event in Camden.",
  "category": "Music",
  "location": "Camden",
  "event_date": "2026-07-20T19:30:00"
}
```

### Comments

```http
POST /posts/{post_id}/comments
GET /posts/{post_id}/comments
DELETE /comments/{comment_id}
```

Creating and deleting comments requires authentication. Users can only delete
their own comments.

Example create comment request:

```json
{
  "content": "Looking forward to this event."
}
```

### Likes

```http
POST /posts/{post_id}/like
DELETE /posts/{post_id}/like
POST /comments/{comment_id}/like
DELETE /comments/{comment_id}/like
```

All like and unlike routes require authentication. A user can like a given post
or comment only once.

### Users

```http
GET /users/search?query={username}
GET /users/{user_id}
GET /users/{user_id}/posts
```

User responses expose public profile fields only and do not include hashed
passwords.

## Data Model

- `User`: username, email, hashed password, creation timestamp
- `Post`: owner, title, description, category, location, event date
- `Comment`: owner, parent post, content
- `Like`: owner and either a parent post or parent comment

Deleting a user cascades to their posts, comments, and likes. Deleting a post
cascades to its comments and likes.

## Run Tests

Run the test suite with:

```bash
pytest
```

Or, using the project virtual environment directly:

```bash
.venv/bin/python -m pytest
```

The tests use an in-memory SQLite database configured in
`tests/database_setup.py`, so they do not need the local `eventsmister.db`
database file.

## Continuous Integration

GitHub Actions is configured in `.github/workflows/tests.yaml`. It installs the
Python dependencies and runs `pytest` on pushes to `main` and on pull requests.

## Development Notes

- `eventsmister.db` is the local SQLite development database.
- Database tables are created automatically when `app.main` starts.
- JWT authentication protects write actions for posts, comments, and likes.
- API behavior is covered by pytest tests for auth, posts, comments, likes, and
  users.
