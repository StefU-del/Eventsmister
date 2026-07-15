# Eventsmister

Eventsmister is a full-stack event discovery app focused on London. The project
is organised as a monorepo with a FastAPI backend and a React frontend. Users
can register, log in, create and browse event posts, comment on posts, like
posts or comments, search for users, and view a user's posts.

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Passlib and bcrypt for password hashing
- python-jose for JWT access tokens
- Pytest

### Frontend

- React
- TypeScript
- Vite
- CSS Modules
- Lucide React

## Project Structure

```text
backend/
  app/
    auth.py              Password hashing and JWT creation
    database.py          SQLite database connection and SQLAlchemy setup
    dependencies.py      Database and authentication dependencies
    main.py              FastAPI app setup and router registration
    models.py            SQLAlchemy models
    schemas.py           Pydantic request and response schemas
    routers/             Auth, post, comment, like, and user routes
  tests/                 Backend API and security tests
  .env.example           Example backend environment variables
  eventsmister.db        Local SQLite development database
  requirements.txt       Python dependencies

frontend/
  src/                   React components, styles, and assets
  package.json           Frontend dependencies and scripts

.github/workflows/       Continuous integration workflows
README.md                Project documentation
```

## Backend Setup

From the repository root, create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Create `backend/.env` from the example file and replace the placeholder with a
long, random JWT signing key:

```bash
cp backend/.env.example backend/.env
```

```text
SECRET_KEY=replace-with-a-long-random-secret
```

## Run the Backend

Run FastAPI from the backend directory so the `app` package, `.env`, and SQLite
database all resolve consistently:

```bash
cd backend
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

## Frontend Setup

In a second terminal, install and run the React application:

```bash
cd frontend
nvm use 22
npm install
npm run dev
```

The frontend is available at `http://localhost:5173` by default. The home page
currently uses local sample events; connecting it to the backend is the next
integration step.

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

Run the backend test suite from its package directory:

```bash
cd backend
pytest
```

Or run it from the repository root using the existing virtual environment:

```bash
.venv/bin/python -m pytest backend/tests
```

The tests use an in-memory SQLite database configured in
`backend/tests/database_setup.py`, so they do not need the local
`backend/eventsmister.db` database file.

Check the frontend with:

```bash
cd frontend
npm run lint
npm run build
```

## Continuous Integration

GitHub Actions is configured in `.github/workflows/tests.yaml`. It runs commands
from `backend/`, installs the Python dependencies, and runs `pytest` on pushes
to `main` and on pull requests.

## Development Notes

- `backend/eventsmister.db` is the local SQLite development database.
- `SECRET_KEY` must be set in `backend/.env` or the environment before starting
  the backend.
- Database tables are created automatically when `app.main` starts.
- JWT authentication protects write actions for posts, comments, and likes.
- API behavior is covered by pytest tests for auth, posts, comments, likes, and
  users.
