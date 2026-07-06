# Eventsmister

Eventsmister is a FastAPI backend for a social media-style app focused on
discovering and sharing events around London.

The project currently supports user authentication and event post management.
Users can register, log in, create event posts, view posts, view a single post,
and delete their own posts.

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
  models.py            SQLAlchemy models
  schemas.py           Pydantic request and response schemas
  routers/
    auth.py            Register and login routes
    posts.py           Event post routes

tests/
  database_setup.py    Test database and FastAPI test client setup
  test_auth.py         Authentication tests
  test_posts.py        Post route tests
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

## API Routes

### Root

```text
GET /
```

Returns a welcome message.

### Authentication

```text
POST /auth/register
POST /auth/login
```

Register creates a new user. Login returns a bearer access token that can be
used for protected routes.

Example register request:

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123!"
}
```

Example login request:

```json
{
  "username": "testuser",
  "password": "Password123!"
}
```

### Posts

```text
GET /posts/
POST /posts/
GET /posts/{post_id}
DELETE /posts/{post_id}
```

Creating and deleting posts requires an `Authorization` header:

```text
Authorization: Bearer <access_token>
```

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

## Current Development Notes

- The app uses SQLite through SQLAlchemy.
- `eventsmister.db` is the local development database.
- JWT authentication is used for protected post routes.
- Comments and likes are already represented in the database models and can be
  built into API routes later.
