# Median · Web (Angular)

Angular frontend for the Go/Angular reimplementation of Median. This app is the
client for the Go backend in [`../backend`](../backend).

Generated with Angular CLI 22.1.4. Single standalone-component app using Angular
signals, no routing.

## Package manager: npm

This app uses **npm** (not the repository-wide pnpm).

- The repo root is a Next.js + pnpm workspace (`pnpm-workspace.yaml`), but it
  has **no** `packages` glob — it is effectively a single-package root. The
  Angular app is a separate, parallel build and keeping it on npm keeps its
  `package.json`/`package-lock.json` self-contained and free of cross-pollution
  with the Next.js workspace.
- Nothing conflicts with the root pnpm workspace because no glob matches
  `go-angular/web`.
- `package.json` declares `engines.node >= 18.19.1` and `packageManager` pins
  npm to the version used to generate the lockfile.

## Prerequisites

- Node.js 22.x (see `.nvmrc` at the repo root), npm.
- Go 1.26+ for the backend.

## Running locally

1. Start the Go backend (serves `GET /api/health` on `:8080`):

   ```sh
   cd ../backend
   make run
   ```

2. Start the Angular dev server:

   ```sh
   npm start
   ```

3. Open `http://localhost:4200/` — the health view calls `/api/health` and
   renders the returned status.

## Dev-time proxy

`npm start` (`ng serve`) runs with `proxy.conf.json` wired in via
`angular.json` → `projects.web.architect.serve.options.proxyConfig`. Requests
to `/api/*` are forwarded to the backend at `http://localhost:8080`, so the app
can fetch `/api/health` same-origin in development (no CORS needed):

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

The proxy is dev-time only; production builds expect a real `/api` origin.

## PostCSS

`postcss.config.mjs` is deliberately empty. Without it, Vite walks up to the
repo root and picks up the Next.js app's `postcss.config.mjs` (Tailwind),
which loads `@tailwindcss/postcss` and emits a Node `DEP0205` deprecation
warning on every `npm start`. Keeping a config here scopes CSS processing to
this app. If you later add PostCSS/Tailwind to the Angular app, extend this
file instead of deleting it.

## Building

```sh
npm run build
```

## Testing

Unit tests use **Vitest** (Angular CLI `@angular/build:unit-test` runner).

```sh
npm test            # watch mode
npm test -- --watch=false
```

One component test covers the health view: it mocks `GET /api/health` with
`HttpTestingController`, asserts the DOM renders `ok`, and coins the error path.