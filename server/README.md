# Realtor Shamraiz — Backend API

Express + TypeScript + Prisma + PostgreSQL. Separate project from the static
site at the repo root — runs as its own process on its own port. `server.js`
at the repo root (the static site's dev server) is untouched by this.

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit DATABASE_URL, JWT secrets, SEED_ADMIN_*
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

The API listens on `http://localhost:4000` by default. Swagger docs at
`/api/docs`. Health check at `/healthz`.

## Database

Any PostgreSQL instance works — only `DATABASE_URL` in `.env` needs to point
at it. Options:

- **Docker Compose** (if Docker is available): `docker compose up -d postgres`
  starts a local Postgres on `localhost:5432` matching the default
  `DATABASE_URL` in `.env.example`.
- **A managed free-tier Postgres** (Neon, Supabase, Railway, ...): create a
  database there and paste its connection string into `DATABASE_URL`.
- **A native local install**: point `DATABASE_URL` at it the same way.
- **No Postgres and no Docker?** `npm run dev:db -- 5433 ./.pglite-data`
  starts PGlite (PostgreSQL compiled to WASM) speaking the real Postgres wire
  protocol, so Prisma connects to it normally:

  ```
  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?schema=public&connection_limit=1&pool_timeout=20&pgbouncer=true"
  ```

  Those query parameters matter: PGlite serves **one connection at a time** and
  shares prepared statements across connections, so Prisma must be limited to a
  single connection with prepared statements disabled. It is a development and
  test convenience only — never run production on it, and don't point two
  processes (e.g. the API and a script) at the same instance at once.

Nothing else in the codebase assumes a specific provider.

## Media storage

Uploaded files are written to `MEDIA_STORAGE_DIR` (default `./storage`,
gitignored) behind the API — nothing outside `src/modules/media` touches the
filesystem directly, so swapping to S3/R2 later only changes that module.

## Testing

```bash
npm test              # unit + integration + e2e smoke
npm run test:unit     # no database needed
```

Integration and e2e tests run against a **separate** database given by
`DATABASE_URL_TEST` — never the development one, since every test truncates
every table. `npm test` applies migrations to it first (the `pretest` script).
With the PGlite dev server, start a second instance for tests:

```bash
npm run dev:db -- 5434 ./.pglite-test-data
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Run with hot reload (tsx watch) |
| `npm run build` / `npm start` | Production build + run |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations (production) |
| `npm run prisma:studio` | Browse the database |
| `npm run db:seed` | Seed demo listings, settings, and the admin user |

## Security notes

See `docs/SECURITY_PLAN.md` at the repo root for the full write-up. In short:
httpOnly/SameSite=Lax JWT + rotating refresh-token cookies, a custom
`X-Admin-Request` header required on state-changing requests as CSRF
defense, bcrypt password hashing, rate limiting on auth and public-lead
routes, Zod validation on every input, and a central error handler that never
leaks internals.
