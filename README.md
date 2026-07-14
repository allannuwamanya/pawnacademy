## Pawn Academy

Pawn Academy is a browser-first chess training platform built with React + Vite. It includes tactics training, an opening explorer, endgame studies, and an in-browser Stockfish engine for analysis and play.

**Quick start**
- **Prerequisites:** Node.js (16+), npm, and access to a PostgreSQL-compatible database (Neon recommended). Set `NEON_DATABASE_URL` in your environment.
- Install and run locally:
	```bash
	npm install
	npm run db:migrate   # apply DB schema (needs NEON_DATABASE_URL)
	npm run dev
	```

**Scripts** (from `package.json`)
- `dev` — start Vite dev server
- `build` — production build
- `preview` — preview build
- `lint` — run `oxlint` rules
- `test` / `test:watch` — run Vitest
- `db:migrate` — apply `database/schema.sql`

**Project layout**
- `src/` — React app and components
- `public/stockfish` — Stockfish JS/WASM builds
- `src/lib/engine` — engine utilities & wrapper
- `functions/` — serverless API routes (Neon DB)
- `database/schema.sql` — schema and seeds
- `database/migrate.js` — simple migration helper

**Important notes**
- Engine hosting: multithreaded WASM builds require COOP/COEP headers. Ensure your hosting adds the following headers if using the multithreaded WASM files:

	Cross-Origin-Opener-Policy: same-origin
	Cross-Origin-Embedder-Policy: require-corp

	If you cannot add these headers, use the single-threaded JS/WASM fallback in `public/stockfish`.

- Authentication: password hashes use PBKDF2 and sessions are stored in `sessions` with an expiry. See `functions/api/[[route]].js` for implementation and `database/schema.sql` for schema.

- Google OAuth: public keys are fetched and cached in the API layer; for high-scale deployments consider a persistent or shared cache.

**Testing & CI**
- Run tests locally: `npm test`.
- Recommended CI: run `npm ci`, `npm test`, and `npm run lint` on PRs.

**Contributing**
- Create a feature branch, run tests and lint before opening a PR. Please add unit tests for any new engine parsing or API behavior.

**Where to look next**
- `src/lib/engine/engineUtils.js` — parsing helpers (covered by unit tests)
- `functions/api/[[route]].js` — serverless API and auth flows
- `database/schema.sql` — DB schema and seeds

If you'd like, I can add a CI workflow, add COOP/COEP header examples for common hosts, or expand the README with deployment instructions.
