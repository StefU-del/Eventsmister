# EventsMister

EventsMister is a full-stack community event discovery application focused on
London. It is organised as a monorepo with a FastAPI API and a Vite-powered
React client.

Users can create an account, sign in, discover and filter events, receive event
suggestions based on their interests, search for other registered users,
publish events with dedicated photos and hashtags, like or unlike posts and
comments, revisit hearted events, join event conversations, maintain a profile,
and manage their own content.

## Technology

### Backend

- Python, FastAPI, SQLAlchemy, SQLite, and Pydantic
- JWT bearer authentication with Passlib and bcrypt password hashing
- Pytest API, database, security, auth, and workflow integration tests

### Frontend

- React, TypeScript, Vite, and React Router
- CSS Modules with a responsive spring-inspired design system
- Lucide React icons
- Vitest, React Testing Library, Cypress, and Playwright

## Project Structure

```text
backend/
  app/
    routers/             Authentication, posts, comments, likes, and users
    auth.py              Password hashing and JWT helpers
    database.py          SQLAlchemy setup and lightweight SQLite migrations
    dependencies.py      Database and authenticated-user dependencies
    main.py              FastAPI configuration and router registration
    models.py            SQLAlchemy data models
    schemas.py           Validated request and response models
    seed_demo.py          Repeatable realistic development-data generator
  tests/
    api/                 HTTP contract and validation tests
    database/            Model, constraint, index, and migration tests
    integration/         Complete API social-workflow test
    test_*.py            Endpoint, security, authentication, and authorisation tests
  .env.example           Backend environment template
  requirements.txt       Python dependencies

frontend/
  cypress/e2e/           Mocked-API Cypress UI tests
  e2e/                   Real full-stack Playwright workflows
  src/
    api/                 Typed API client and resource modules
    auth/                Session provider and protected-route handling
    components/          Dedicated reusable component files by feature
    pages/               Route-level screens
    test/                Shared frontend test helpers
    utils/               Display, parsing, and recommendation helpers
  cypress.config.ts      UI browser test configuration
  playwright.config.ts   Isolated full-stack E2E configuration
  package.json           Frontend dependencies and commands

.github/workflows/       Pull request and main-branch CI
pytest.ini               Pytest test-layer marker configuration
```

## Local Setup

Create and activate a Python virtual environment from the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create the backend environment file and replace the placeholder with a long,
random signing key:

```bash
cp backend/.env.example backend/.env
```

```text
SECRET_KEY=replace-with-a-long-random-secret
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`DATABASE_URL` is optional. When it is omitted, the backend uses
`backend/eventsmister.db`. `UPLOAD_DIRECTORY` is also optional and defaults to
`backend/uploads`.

Install the frontend dependencies:

```bash
cd frontend
nvm use 22
npm install
```

## Run the Application

Start the API from the backend directory:

```bash
cd backend
../.venv/bin/python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`; interactive documentation is available
at `http://127.0.0.1:8000/docs`.

In another terminal, start the frontend:

```bash
cd frontend
nvm use 22
npm run dev
```

The client runs at `http://localhost:5173`. Set `VITE_API_BASE_URL` in
`frontend/.env.local` only when the API uses a different address.

## Demo Data

Populate the development database with a busier, repeatable social dataset:

```bash
cd backend
../.venv/bin/python -m app.seed_demo
```

This creates 30 completed demo profiles, 100 future events with unique seeded
images, 400 comments, 796 event likes, and 800 comment likes. Sign in with
`demo_aisha` and password `DemoPass123!` to explore the populated application.
All demo accounts use that password.

The command is safe to rerun: it replaces accounts whose usernames start with
`demo_` and their associated social activity, while preserving ordinary
development users and their content. The seeded event and profile images use
remote placeholder services, so viewing those images requires an internet
connection.

## Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Discover, search, filter, and view interest-based event suggestions |
| `/events/:postId` | View an event, like it, and join its conversation |
| `/events/new` | Create an event; authentication required |
| `/hearted` | View and manage hearted events; authentication required |
| `/people` | Search public user profiles; authentication required |
| `/users/:userId` | View profile details and events; owners can edit their profile |
| `/login` | Sign in and return to the requested page |
| `/register` | Create a unique, validated account |

## API Summary

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`,
  `GET /auth/me/liked-posts`
- `GET /posts/`, `POST /posts/`, `GET /posts/{post_id}`,
  `DELETE /posts/{post_id}`
- `GET /posts/{post_id}/comments`, `POST /posts/{post_id}/comments`,
  `DELETE /comments/{comment_id}`
- `POST` and `DELETE` like routes for posts and comments
- `POST /uploads/images`, `GET /uploads/{filename}`
- `GET /users/search`, `GET /users/{user_id}`,
  `GET /users/{user_id}/posts`

Write operations and user search use `Authorization: Bearer <access_token>`. A
user can only delete their own posts and comments, duplicate likes are prevented
at both the API and database levels, and public user responses omit email,
password hashes, and date of birth. Request schemas validate usernames,
passwords, dates, image URLs, hashtags, interests, and content lengths. Uploads
require authentication and accept verified JPEG, PNG, or WebP files up to 5 MB.

Profile interests and profile photos are public. Date of birth is private and
is returned only by `/auth/me`. Users choose event and profile photos from their
computer; the backend stores them under `backend/uploads` by default and returns
the generated URL used by posts and profiles. Legacy records without an event
photo use a bundled fallback. Hashtags link back to a filtered discovery feed,
and recommendations rank category and hashtag matches against the signed-in
user's interests.

## Testing

Run the complete backend suite with the CI coverage threshold:

```bash
cd backend
../.venv/bin/python -m pytest --cov=app --cov-report=term-missing --cov-fail-under=90
```

Run only the API workflow integration test:

```bash
cd backend
../.venv/bin/python -m pytest -m integration
```

The backend layers can also be run independently:

```bash
../.venv/bin/python -m pytest -m api
../.venv/bin/python -m pytest -m database
../.venv/bin/python -m pytest -m security
../.venv/bin/python -m pytest -m auth
```

Run frontend unit and component checks:

```bash
cd frontend
npm test
npm run test:coverage
npm run lint
npm run build
```

Frontend coverage is enforced at 90% for statements, functions, and lines, and
80% for branches. Backend CI enforces at least 90% application coverage with
`pytest-cov`.

Run the routed React UI against deterministic mocked API responses:

```bash
cd frontend
npm run test:ui
```

Cypress covers event rendering, search and category filters, hashtags, safe
display of HTML-like content, protected-route redirects, session restoration,
hearted events, local photo uploads, and authentication error states.

Run the full browser workflow:

```bash
cd frontend
npm run test:e2e
```

The Playwright configuration starts its own API and Vite servers and creates a
temporary SQLite database under `/tmp`, so it does not modify the development
database. Browser scenarios exercise two real users through registration,
profile editing, profile and event photo uploads, hashtags, recommendations,
authenticated user search, hearted-event retrieval, likes, comments, ownership
controls, logout navigation, protected deep-link restoration, backend validation
errors, and cleanup.

## Continuous Integration

`.github/workflows/tests.yaml` runs five independent jobs on pushes to `main`
and every pull request:

- backend API, database, security, authentication, and authorisation tests
- frontend lint, component tests, and production build
- API social-workflow integration test
- Cypress UI tests with mocked API responses
- Playwright full-stack E2E tests with a disposable database

## Development Notes

- Database tables and small compatibility migrations run when FastAPI starts.
- SQLite foreign-key enforcement prevents orphaned social records.
- CORS origins are configured with `FRONTEND_ORIGINS`.
- API responses include content sniffing, framing, and referrer protections.
- The frontend stores the JWT session locally and verifies it through
  `GET /auth/me` when the application starts.
- Logging out clears the local session and returns the user to discovery.
- Components, pages, API resources, and their CSS Modules are kept in dedicated
  files to keep feature ownership clear.
