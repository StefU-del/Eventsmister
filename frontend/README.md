# EventsMister Frontend

React and TypeScript client for the EventsMister event community. It provides
event discovery, authenticated user search, authentication, event publishing,
likes, comments, editable profiles, interest-based recommendations, hashtags,
dedicated event images, a protected hearted-events shortlist, and owner-only
content controls.

## Run Locally

Start the FastAPI backend at `http://127.0.0.1:8000`, then run:

```bash
nvm use 22
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

## Commands

```bash
npm run dev            # Start the Vite development server
npm run build          # Type-check and create a production build
npm run lint           # Run ESLint
npm run preview        # Preview the production build
npm test               # Run Vitest once
npm run test:watch     # Run Vitest in watch mode
npm run test:coverage  # Generate frontend test coverage
npm run test:ui        # Run Cypress UI tests with a mocked API
npm run test:ui:open   # Open the Cypress UI runner
npm run test:e2e       # Run isolated full-stack Playwright tests
```

Coverage thresholds are enforced at 90% for statements, functions, and lines,
and 80% for branches.

## Source Layout

- `src/api` contains the shared HTTP client, response types, and resource APIs.
- `src/auth` owns session restoration, liked-item state, and protected routes.
- `src/components` groups dedicated UI and CSS Module files by feature.
- `src/pages` contains route-level screens and orchestration.
- `src/test` contains reusable Vitest and React Testing Library helpers.
- `cypress/e2e` contains routed UI tests with deterministic HTTP intercepts.
- `e2e` contains Playwright tests that use the real frontend and backend together.

Global design tokens and the reset live in `src/index.css`. Component styles
use co-located CSS Modules. The palette combines mint, coral, yellow, sky, and
neutral tones while retaining accessible contrast and responsive layouts.

## Configuration

Use `.env.example` as the committed template. Override the API URL in
`.env.local` when necessary:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Only variables prefixed with `VITE_` are exposed to browser code. Backend
secrets must remain in `backend/.env`.

Cypress starts Vite on port `5175` and mocks API responses. Playwright starts
isolated servers on ports `8001` and `5174` and uses a temporary SQLite
database, leaving the local development data untouched.

## Discovery And Profiles

Event creation accepts a JPEG, PNG, or WebP photo selected from the user's
computer and up to eight hashtags. Profile photos use the same upload control;
files are limited to 5 MB. Clicking a hashtag opens the filtered discovery
feed. Signed-in users who add interests to their profile receive category and
hashtag-based event suggestions on the home page.

People search is available only to authenticated users. Interests and profile
photos are public profile details; date of birth remains private to the account
owner. Event photos use a local fallback when a supplied URL cannot be loaded.
Authenticated users can revisit hearted events at `/hearted`; removing a heart
there updates the shortlist immediately.
