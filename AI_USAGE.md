# AI Usage

This document describes — transparently — how AI was used to build this project,
what was AI-generated, what was human-reviewed, and where the AI got things
wrong.

## AI Tools Used

- **Claude Code** (Anthropic) — primary tool: scaffolding, API/DB/UI code,
  schema design, docs, and running/verifying the app via the terminal.

## What AI Helped With

- **Architecture decision** — comparing "Pages + separate Workers API" vs a
  single Worker serving both SPA assets and the API; chose the single-Worker
  approach to avoid CORS and keep one free-tier deploy.
- **Database schema** — `transactions` + `categories` tables, CHECK constraints,
  and indexes on `type`, `transaction_date`, `category`.
- **API design** — Hono routes for CRUD, dashboard summary, monthly report,
  category breakdown, and CSV export.
- **SQL for reports** — the monthly `GROUP BY substr(transaction_date,1,7)`
  aggregation and the conditional-`SUM(CASE WHEN ...)` income/expense rollups.
- **Auth** — stateless HMAC-signed session cookie using Web Crypto, with
  constant-time comparison for both the password check and the MAC.
- **UI components** — responsive Tailwind layout (sidebar + mobile bottom nav),
  dashboard cards, transaction table/cards, add/edit modal, charts, dark mode.
- **Validation** — server-side payload validation (positive amount, valid date,
  known category, type whitelist).
- **Tooling** — Playwright screenshot script, README, this file.

## Example Prompts

1. "Read the assignment in `docs/` and propose an architecture that stays on the
   Cloudflare free tier; recommend a stack and explain the trade-offs."
2. "Design a Cloudflare D1 schema for an income/expense tracker with the right
   indexes, plus a categories table for custom categories."
3. "Write a stateless single-user auth for a Worker: password from an env var,
   issue an HMAC-signed session cookie with Web Crypto — no hardcoded secrets."
4. "Build the Hono API: CRUD for transactions, a dashboard summary endpoint, a
   monthly report, a category breakdown, and a CSV export that opens correctly
   in Excel with Thai text."
5. "Create a mobile-first React dashboard with the 6 summary stats and a donut
   chart of expenses by category."

## Human Review

The developer directed and reviewed the AI throughout. Specific areas reviewed
or changed for **business logic / security / correctness** reasons:

- **Average-expense-per-day logic (business logic).** The naive version divided
  the month's expense by the number of calendar days in the month. For the
  *current* month that understates the daily average (it divides by 30 even on
  the 12th). This was changed to divide by **days elapsed so far** for the
  current month, and by full days only for past months.
- **Secrets handling (security).** Confirmed that `ADMIN_PASSWORD` and
  `SESSION_SECRET` are only ever read from env/`.dev.vars`, that `.dev.vars` is
  gitignored, and that the cookie is `HttpOnly` + `Secure` + `SameSite=Lax`.
- **CSV injection / escaping (security & correctness).** Verified every CSV cell
  is quoted/escaped and that a UTF-8 BOM is prepended so Thai descriptions are
  not mangled by Excel.
- **SQL safety.** Confirmed all queries use bound parameters (no string
  concatenation), and that the `LIKE` search escapes `%`/`_`/`\`.
- **Multi-user upgrade (data isolation).** Because all DB access was centralized
  in `worker/db.ts`, adding multi-user was a localized change: migration `0002`
  adds a `users` table + `user_id` columns (backfilling existing data under a
  demo account), and every query gained `WHERE user_id = ?`. Isolation was
  **verified manually** — a second registered account sees an empty ledger and
  cannot read or write the demo user's rows. Login runs a constant-time password
  verify even when the email doesn't exist, to avoid leaking which emails are
  registered (user enumeration).

## Mistakes Found From AI

Real issues the AI introduced during this build and how they were fixed:

1. **Over-clever TypeScript type.** The AI first typed a helper as
   `parseFilters(c: Parameters<Parameters<typeof api.get>[1]>[0])` to "infer" the
   Hono context type. It was fragile and unreadable. **Fix:** replaced it with
   the proper public type `Context<AppEnv>` imported from `hono`.

2. **Query-string typing bug (caught by the build).** The `toQueryString` helper
   was typed `Record<string, unknown>`, but the typed `TransactionQuery`
   interface has no index signature, so `tsc` failed the production build.
   **Fix:** widened the parameter type so the typed query object is accepted.

3. **Brittle test selector.** The Playwright screenshot script used
   `text=Dashboard`, which matched the (hidden) desktop sidebar link on the
   mobile viewport and timed out. **Fix:** switched to a role-based selector
   (`getByRole('heading', { name: 'Dashboard' })`).

Each of these was caught either by running the production build (`npm run
build`) or by actually exercising the app, not by assuming the AI's output was
correct.
