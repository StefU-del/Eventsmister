# EventsMister Frontend

React and TypeScript frontend for discovering and sharing London events.

## Run locally

```bash
nvm use 22
npm install
npm run dev
```

The Vite development server is available at `http://localhost:5173` by default.

## Commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
npm test         # Run the frontend test suite once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests and create a coverage report
```

## Styling

- `src/index.css` contains the global reset and design tokens.
- Component styles use CSS Modules, such as `src/App.module.css`.
- Spring accent colours are exposed as CSS custom properties in `src/index.css`.

The home page loads event posts from the FastAPI `GET /posts/` endpoint. Start
the backend on `http://127.0.0.1:8000` before running the frontend.

The default API URL can be changed in `.env.local`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Use `.env.example` as the committed template. Only variables prefixed with
`VITE_` are exposed to frontend code, so secrets must remain in `backend/.env`.
