# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (required).

- `pnpm dev:ui` — Vite dev server at `http://localhost:5173`
- `pnpm dev:supabase` — start local Supabase (`supabase start`)
- `pnpm dev:powersync:start` / `pnpm dev:powersync:stop` — PowerSync container via `powersync/compose.yaml`
- `pnpm build` — `tsc -b && vite build`
- `pnpm type-check` — `tsc --noEmit`
- `pnpm lint` — ESLint (flat config, `eslint.config.js`)

There is no test runner configured.

Local stack requires three pieces running together: Supabase, the PowerSync Docker container, and the Vite UI. The PowerSync container joins the `supabase_network_powersync` Docker network and reaches Supabase via the internal hostname `supabase_kong_powersync:8000` (see `powersync/powersync.yaml`). Auth uses Supabase RS256 JWTs verified through JWKS — `supabase/signing_keys.json` must be generated locally (`supabase gen signing-key --algorithm RS256`) and is gitignored.

Env vars (see `.env.local.template`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_POWERSYNC_URL` for the client; `PS_POSTGRESQL_URI`, `PS_SUPABASE_JWT_SECRET`, `PS_API_TOKEN`, `PS_PORT` for the PowerSync container.

## Architecture

Offline-first POS. Reads/writes go to a local SQLite (WA-SQLite/OPFS) database; PowerSync syncs that database with Supabase Postgres.

### Data layer (the important bit)

Three layers stack on each other — when adding a table or field, all three usually need updating:

1. **`src/powersync/AppSchema.ts`** — PowerSync `Schema` declaring local SQLite tables (`cashiers`, `categories`, `products`, `sales`, `sale_items`). SQLite types only: `column.text | integer | real`. Booleans are stored as 0/1 integers; dates as ISO strings. Table-name constants (`CASHIERS_TABLE`, etc.) and record types are exported from here.
2. **`src/collections/*.ts`** — TanStack DB collections built with `powerSyncCollectionOptions` from `@tanstack/powersync-db-collection`. Each collection pairs a Zod schema (which transforms 0/1 → boolean and ISO strings → `Date`) with the matching `AppSchema.props.<table>`. UI code consumes these via `useLiveQuery` from `@tanstack/react-db`.
3. **`supabase/migrations/*.sql`** — source-of-truth Postgres schema. **Sync rules** (`powersync/sync-rules.yaml`) project Postgres rows into client buckets; today everything lives in a single `global` bucket.

Two write paths exist and both are used in `src/contexts/cart-context.tsx`:
- Direct SQL via `powerSync.execute` / `powerSync.writeTransaction(tx => …)` against `<TABLE>` constants. Multi-statement work goes through `writeTransaction` so totals stay consistent.
- Reactive reads via `useLiveQuery((q) => q.from({ x: collection }).where(…))` with `eq`/`and` from `@tanstack/db`.

CRUD writes are queued by PowerSync and pushed back to Supabase by `SupabaseConnector.uploadData` (`src/powersync/SupabaseConnector.ts`), which translates `PUT/PATCH/DELETE` ops into `upsert/update/delete` against the matching Supabase table. Postgres class 22, 23, and 42501 errors are treated as fatal (transaction discarded) so they don't block the upload queue.

### App shell

- `src/main.tsx` wraps the tree in `SystemProvider` (PowerSync + Supabase contexts).
- `src/powersync/System.ts` instantiates the singleton `PowerSyncDatabase` (OPFS VFS, multi-tab when `SharedWorker` exists, RUST sync client) and calls `initializePowerSync()` at module load — anonymous Supabase sign-in plus `powerSync.connect(connector, …)`. Failure logs and falls through to offline mode rather than blocking app boot.
- `src/App.tsx` mounts `AuthProvider` → `CartProvider` → TanStack Router (`routeTree.gen.ts` is generated from `src/routes/*`).
- `src/routes/__root.tsx` renders the top status bar driven by `useStatus()` from `@powersync/react`.

### Auth model

`AuthProvider` (`src/contexts/auth-context.tsx`) is PIN-based and intentionally permissive for the demo: it queries `cashiers` by `pin_hash`, but if no row matches and the PIN is 4 digits it still creates an in-memory `demo-<pin>` cashier. Supabase anonymous sign-in is best-effort.

### Path alias

`@/*` → `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).

## Conventions worth knowing

- Coding style guidance lives in `.cursor/rules/optimized-react-powersync.mdc` (functional patterns, mobile-first, ShadCN-style UI primitives in `src/components/ui/`, Zod for validation).
- Table names always come from the constants exported by `AppSchema.ts` — don't hardcode strings in SQL.
- New synced fields require: column in `AppSchema.ts`, Zod field in the matching `collections/*.ts`, a Supabase migration, and a column in the relevant `SELECT` inside `powersync/sync-rules.yaml`.
