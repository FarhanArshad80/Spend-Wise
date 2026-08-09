# SpendWise — Personal Expense Tracker

A web-based personal finance app where users track daily income and expenses, manage monthly and category budgets, set recurring transactions, view spending analytics, and receive configurable budget alerts.

## Run & Operate

- `pnpm --filter @workspace/expense-tracker run dev` — run the frontend (port assigned by artifact)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Auth env (auto-provisioned): `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, Recharts, Framer Motion, Wouter
- Auth: Replit-managed Clerk (`@clerk/react` / `@clerk/express`)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v3, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — DB tables: categories, transactions, recurring, budgets, budget_alerts, users
- `artifacts/api-server/src/routes/` — Express route handlers (transactions, categories, recurring, budgets, budget-alerts, reports, settings)
- `artifacts/expense-tracker/src/pages/` — All app pages (dashboard, transactions, budgets, categories, recurring, reports, settings, landing)
- `artifacts/expense-tracker/src/components/layout/` — Shell, Sidebar, TopNav

## Architecture decisions

- All integer fields in OpenAPI spec use `type: number` (not `type: integer`) to avoid `zod.int()` calls that don't exist in Zod v3
- Clerk auth uses cookie-based sessions on web; no bearer tokens needed for browser API calls
- Default categories are seeded directly in the DB (not per-user) with `is_default = true`; user custom categories have `userId` set
- Budget `spent`/`remaining`/`percentUsed` are computed at query time, not stored
- `pnpm run typecheck:libs` must be run after any changes to `lib/*` packages so leaf artifact typechecks see fresh declarations

## Product

- **Landing**: Marketing page with sign up / sign in CTAs
- **Dashboard**: Budget progress (most prominent), income/expense summary, spending charts, recent transactions, triggered alerts
- **Transactions**: Full CRUD with search + filters (type, category, date range, amount)
- **Budgets**: Overall monthly budget + per-category budgets with visual progress bars
- **Categories**: Separate income/expense categories; custom categories supported
- **Recurring**: Monthly recurring transactions with manual trigger; isActive toggle
- **Reports**: Spending by category (pie), monthly trend (line), budget vs actual (bar), weekly summary
- **Settings**: Currency, weekly email toggle, default view

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `lib/*` change, run `pnpm run typecheck:libs` before running artifact typechecks
- Do NOT change `info.title` in `openapi.yaml` — Orval uses it to derive output filenames
- `type: integer` in the OpenAPI spec generates `zod.int()` which breaks on Zod v3 — always use `type: number`
- Clerk Proxy middleware must be mounted before body parsers in `app.ts`
- `serial()` columns in Drizzle require `Math.round()` when receiving values from API (they come as `number` from Zod coercion)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup details
