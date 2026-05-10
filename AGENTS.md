# AGENTS.md — InvenTU

## Project Overview

Inventory management system. Monorepo with two workspaces:

- **Backend** (`backend/`) — .NET 10.0, ASP.NET Core API
- **Frontend** (`frontend/`) — Astro 6 + TailwindCSS 4, SSR via `@astrojs/node`

## Developer Commands

### Backend (run from repo root)

```bash
dotnet build                          # build all 4 projects
dotnet run --project backend/InvenTU.Api   # start API (dev, reads appsettings.Development.json)
dotnet ef migrations add <name> -p backend/InvenTU.Infrastructure   # add migration
dotnet ef database update -p backend/InvenTU.Infrastructure         # apply migrations
```

### Frontend (run from `frontend/`)

```bash
pnpm install
pnpm dev         # dev server on :4321
pnpm build       # production build → ./dist/
```

### Full Stack (Docker)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Starts Postgres (:5433), API (:4000), Frontend (:4321). Requires `.env` at repo root (copy from `.env.example`).

## Backend Architecture

Clean architecture, 4 projects with this dependency graph:

```
InvenTU.Core         ← entities, enums (no deps)
InvenTU.Application  ← use-case logic, auth services (depends on Core)
InvenTU.Infrastructure ← EF Core, Identity, JWT, migrations (depends on Core + Application)
InvenTU.Api          ← web entrypoint, controllers, OpenAPI (depends on Infrastructure + Application)
```

- **Entry point**: `backend/InvenTU.Api/Program.cs` — registers all services via `AddInvenTUInfrastructure()`
- **DbContext**: `InvenTU.Infrastructure.Data.InvenTUDbContext` — Identity with `Guid` keys, tables: Users, Roles, RefreshTokens, Categories, Products, Warehouses, StockLocations, StockItems, StockMovements, Alerts, Suppliers, PurchaseOrders, PurchaseOrderLines
- **Migrations**: `backend/InvenTU.Infrastructure/Migrations/`
- **Auth**: JWT bearer + refresh tokens. Requires `JwtSettings__Secret` env var or app will throw on startup.
- **Logging**: Serilog — console + rolling JSON files in `logs/`

## Configuration

- **NuGet**: Central Package Management (`Directory.Packages.props`). Lock files enabled per-project.
- **Code style**: `.editorconfig` at root. Nullable enabled, implicit usings, file-scoped namespaces. CS8602/CS8604/CA2000 treated as errors.
- **DB port**: Docker maps Postgres to **5433** (not default 5432).
- **API default port**: 4000 (env `PORT`).
- **Frontend connects to**: `PUBLIC_API_BASE_URL=http://localhost:4000/api`

## Frontend

- Astro SSR with Node adapter (`@astrojs/node`).
- API client: `axios`.
- No test framework configured yet.

## Testing

No test projects exist. When adding tests, follow the layer structure — test projects would mirror `InvenTU.*.Tests` naming.

## Gotchas

- API **will crash on startup** if `JwtSettings__Secret` is not set.
- EF Core migrations must be run from the repo root with `-p backend/InvenTU.Infrastructure`.
- `TreatWarningsAsErrors` is **false** globally, but null-reference analyzers (CS8602, CS8604) and CA2000 are elevated to errors in `.editorconfig`.
