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
```

## Styling

- `src/index.css` contains the global reset and design tokens.
- Component styles use CSS Modules, such as `src/App.module.css`.
- Spring accent colours are exposed as CSS custom properties in `src/index.css`.

The home page currently uses local sample events. Connecting it to the FastAPI
`GET /posts/` endpoint is the next integration step.
