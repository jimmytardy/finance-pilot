# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Finance Pilot is a personal budget app built with Next.js 16 (App Router), React 19, Prisma 6 and PostgreSQL, NextAuth v4 with Google OAuth, Tailwind 4 and shadcn/Radix. The UI is in French and English, and code comments and API error strings are mostly in French.

## Commands

Use **pnpm** only, never npm or yarn.

```bash
pnpm dev                 # dev server on :3000
pnpm build               # production build (output: 'standalone')
pnpm exec tsc --noEmit   # type-check: next.config.mjs sets ignoreBuildErrors, so build does NOT catch TS errors
pnpm db:migrate          # prisma migrate dev; commit generated files under prisma/migrations/
pnpm db:push             # prisma db push (no migration history)
```

- There is no test suite. `pnpm lint` exists, but ESLint is not in devDependencies and there is no config, so it will not run unless you set it up.
- The Prisma CLI reads `.env`, **not** `.env.local`.
- `postinstall` runs `prisma generate`.

## Architecture

### Auth gates everything
`middleware.ts` redirects unauthenticated users to `/connexion` for every app route. NextAuth uses the **JWT** session strategy (`lib/auth-options.ts`). The Prisma adapter only stores users and accounts. API routes resolve the user with `getAuthenticatedUserId(request)` (`lib/auth-user-from-request.ts`, reads `token.sub`), return 401 when it is null, and scope every Prisma query by `userId`. The Edge middleware only reads `NEXTAUTH_SECRET` (`lib/nextauth-secret.ts`). All other env vars are validated in `lib/env.ts` (`getCanonicalEnv`), so add new variables there. `SKIP_ENV_VALIDATION=1` is used during the Docker build.

The README is partly out of date. The marketing and guide pages, and the `/simulateur/*` prefix, are gone. `next.config.mjs` redirects `/`, `/simulateur/*`, `/guides*` and `/strategies-patrimoine` to the flat routes under the `app/(simulateur)/` route group (`/donnees`, `/gestion-mensuel`, `/gestion-annuelle`, `/estimations`, `/comparaison`, `/salaires/...`). When you add a protected page, also add it to the `matcher` in `middleware.ts`.

### Two persistence models
1. **Simulator (budget data) stored as a single JSON document.** `contexts/simulator-workspace-context.tsx` (`SimulatorWorkspaceProvider`) holds a `SimulatorPersistedBundle` (`lib/simulator-payload.ts`). The bundle contains a version, per-month `monthlySnapshots` keyed `YYYY-MM` and holding `FinanceData`, `savedProjects`, `activeProjectId` and `scheduleCompletion`. It loads with `GET /api/simulator/state` and saves with a debounced `PUT` into the `SimulatorState` table (one row per user). Incoming data always goes through `normalizeFinanceData` / `lib/normalize-finance-data.ts`, so keep that in sync when you change `lib/types.ts`. `hooks/use-finance-data.ts` (`FinanceDataProvider`) exposes the active month's data and derived metrics (`lib/finance-metrics.ts`). Both providers are mounted by `ConditionalFinanceProvider`.
2. **Salaries module stored as relational Prisma tables.** It uses the `Employer`, `EmploymentPeriod`, `Payslip` and `PayslipLine` tables, accessed through REST routes under `app/api/salaires/`. A `Payslip` is a monthly `BULLETIN` or an `EPARGNE_SALARIALE` statement; it stores the printed totals, and each line has a `bloc` and a `categorie` from the taxonomy in `lib/payslip-categories.ts` (shared by the AI prompt, Zod validation, stats and UI). Route pattern:
   - auth check, then `request.json()`, then Zod `safeParse` with a schema from `lib/salary-schemas.ts`
   - Prisma call, with money stored as `Decimal` via `toPrismaDecimalString`
   - serialize with `lib/salary-json.ts`

   Changes to employment periods or payslips call `reconcilePayslipEmployersForUser` (`lib/salary-employer-period.ts`) to re-link payslips to employers. Stats (fixed/variable, profit sharing, cumulative take-home) are computed in `lib/salary-stats.ts` and served by `/api/salaires/stats`. The client UIs live in `components/salaires/`.

### Payslip AI extraction
`POST /api/salaires/payslip/extract` sends a PDF or image to Mistral Document AI (`lib/payslip-extract-mistral.ts`). The output passes through `lib/payslip-extraction-schema.ts` and then `lib/payslip-extraction-normalize.ts`, which reclassifies lines by label and returns consistency warnings. The extraction is never saved directly: the client reviews the draft, then POSTs it to `/api/salaires/payslips`. To check extraction quality, put payslip PDFs in `examples/` (gitignored) with expected values in `examples/expected.json`, then run `MISTRAL_API_KEY=… pnpm dlx tsx --tsconfig tsconfig.json scripts/test-payslip-extraction.ts [--fresh] [--lines]`; it uses the production request builder (`lib/payslip-extraction-request.ts`) and caches responses in `examples/.cache/`. The feature is enabled only when `MISTRAL_API_KEY` is set (`isPayslipExtractionConfigured`), and the UI hides the button otherwise.

### i18n
All user-facing strings go in **both** `locales/fr.json` and `locales/en.json` and are rendered with `react-i18next` `t()`. The setup lives in `lib/i18n/`.

## Deployment / infra (from `.cursor/rules/infrastructure-vps.mdc`)
- The app runs on a 4 GB Ubuntu VPS with Docker Compose. PostgreSQL, Keycloak and Nginx Proxy Manager are **shared services** in `~/shared-project/`.
- `docker-compose.yml` must **not** define its own postgres, nginx or keycloak services. It must declare the external network `postgres_network` (DB host `postgres`, user `admin`, DB `finance_pilot`), use `restart: unless-stopped`, and have no `version:` key. It publishes no ports because exposure goes through Nginx Proxy Manager.
- Schema changes use Prisma migrations only (no Liquibase). `docker-entrypoint.sh` can run `migrate deploy` or `db push` on start, depending on `RUN_MIGRATIONS_ON_START` and `RUN_DB_PUSH_ON_START`. You can also run migrations once with `docker compose run --rm --entrypoint prisma app migrate deploy`.
- An alternative non-Docker deployment uses PM2 (`ecosystem.config.cjs`, which loads `.env.production`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
