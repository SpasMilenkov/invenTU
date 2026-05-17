# Frontend E2E Tests

Playwright-based end-to-end tests for the four critical user journeys: login,
product create, stock receive, dashboard load.

## Prerequisites

- Docker (Compose v2)
- Node ≥ 22.12 and pnpm 11
- Repo root `.env` populated (copy from `.env.example`)

## First-time setup

From `frontend/`:

```
pnpm install
pnpm test:e2e:install     # downloads chromium / firefox / webkit binaries
```

## Running the suite

**Full one-shot (recommended; matches the acceptance criterion):**

```
pnpm test:e2e
```

This brings up `docker-compose.dev.yml` with a fresh Postgres volume,
waits for `/api/v1/health` 200 and `/` 200, runs Playwright, then tears
the stack down regardless of test outcome.

**Dev loop (assumes the stack is already up):**

```
pnpm test:e2e:run [--ui] [--project=chromium] [path/to/spec.ts]
```

**Open the last HTML report:**

```
pnpm test:e2e:report
```

## Credentials

Default admin credentials live in `frontend/.env.test`:

- `E2E_ADMIN_EMAIL=admin@inventu.dev`
- `E2E_ADMIN_PASSWORD=DevAdmin123`

Both match the dev seed user in `backend/InvenTU.Api/appsettings.Development.json`.
Override at runtime by exporting either env var.

## Auth model

Auth is **cookie-based** (`AccessToken` / `RefreshToken` httpOnly cookies
issued by `POST /api/v1/auth/login`). The `setup` project (`auth.setup.ts`) drives
the real login form once and saves cookies to
`frontend/playwright/.auth/admin.json`. The chromium / firefox / webkit
projects load this file via `storageState`, so every spec begins logged-in.

For specs that must start logged-out (e.g. the login flow itself), opt out
at the top of the file:

```ts
import { test, STORAGE_STATE_LOGGED_OUT } from './fixtures/auth';
test.use({ storageState: STORAGE_STATE_LOGGED_OUT });
```

## Selectors

The four critical flows have stable `data-testid` hooks:

| Flow | Selectors |
| --- | --- |
| Login | `login-email`, `login-password`, `login-submit`, `login-error` |
| Product create | `product-form`, `product-sku`, `product-name`, `product-category`, `product-warehouse`, `product-unit-price`, `product-cost-price`, `product-submit` |
| Stock receive | `stock-receive-form`, `stock-receive-ref`, `stock-receive-product`, `stock-receive-warehouse`, `stock-receive-location`, `stock-receive-qty`, `stock-receive-notes`, `stock-receive-submit`, `stock-receive-confirmation` |
| Dashboard | `dashboard-heading`, `dashboard-kpis`, `dashboard-chart`, `dashboard-recent-movements`, `dashboard-live-feed` |

Use `page.getByTestId('...')` for these. For everything else, prefer
role-based queries: `page.getByRole('button', { name: /Save/ })`.

## Specs in this directory

| Spec | Cases |
| --- | --- |
| `login.spec.ts` | happy login · wrong password · empty submit · invalid email format |
| `product-create.spec.ts` | happy create · duplicate SKU rejection · missing required fields · server 500 toast |
| `stock-receive.spec.ts` | end-to-end receipt · submit-disabled gating · qty=0 rejection · location reset on warehouse change |
| `dashboard.spec.ts` | renders 5 sections · KPI numeric values · chart hydrates · stats-failure retry banner |

Helpers under `fixtures/`:

- `auth.ts` — `test`, `expect`, `STORAGE_STATE_LOGGED_OUT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `data.ts` — `uniqueSku()` for collision-free SKUs across parallel runs
- `selectors.ts` — `selectFirstCategory(page, wrapperTestId)`, `selectFirstOption(select)`
- `forms.ts` — `fillProductForm(page, overrides)`, `walkStockReceive(page, overrides)`

## Artifacts

- HTML report: `frontend/playwright-report/`
- Per-test screenshots / video / trace: `frontend/test-results/`
- Stored auth state: `frontend/playwright/.auth/admin.json` (gitignored)

Failed runs always retain a screenshot
(`screenshot: 'only-on-failure'` in `playwright.config.ts`).

## Adding a new spec

1. Create `tests/e2e/<feature>.spec.ts`.
2. Import `test` and `expect` from `./fixtures/auth` (not from `@playwright/test`
   directly) — that's the local extension seam.
3. If your spec must start logged-out, apply `STORAGE_STATE_LOGGED_OUT` as
   shown above.
4. Generate any unique data with helpers from `./fixtures/data` (e.g. `uniqueSku()`).
5. Run `pnpm test:e2e:run path/to/your.spec.ts --project=chromium` to iterate.

## Database state

The one-shot script drops the Postgres volume on every run, so seeded
data is deterministic. Specs may safely assert on the seeded admin,
warehouses, categories, and products. See `backend/InvenTU.Infrastructure/DataSeeders/`
for the canonical seed.
