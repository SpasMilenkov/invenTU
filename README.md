# InvenTU

An inventory management system for warehouse and stock operations, built as a .NET 10 API and an Astro / React frontend.

## Overview

InvenTU is a monorepo containing a clean-architecture ASP.NET Core backend, an Astro 6 SSR frontend with React 19 islands, and a Postgres database. The system covers the day-to-day inventory workflow — receiving, issuing, transferring, and adjusting stock across multiple warehouses — and layers on purchase orders, supplier management, low-stock alerts, reporting, and a real-time dashboard powered by SignalR.

The full stack runs locally via Docker Compose, and end-to-end tests cover the critical user flows.

## Features

**Catalog**

- Products with SKU, pricing, category, supplier, and per-warehouse stock
- Full-text product search backed by Postgres GIN trigram indexes on `Name` and `SKU`
- Categories and suppliers with full CRUD

**Stock operations**

- Receive, issue, transfer, and adjust stock — each operation has its own controller and service
- Stock movements are persisted as an immutable history
- Per-warehouse stock locations

**Alerts & real-time**

- Low-stock monitoring runs as a hosted background service
- Per-user alert state tracking
- SignalR hubs for live updates: `/hubs/stock` (live stock feed) and `/hubs/alerts` (notifications)

**Reporting**

- Reports page in the UI
- PDF report generation via QuestPDF

**Dashboard**

- KPI cards, recent movements list, live stock feed

**Auditing**

- Persistent audit log with a dedicated controller and admin-facing page

**Auth & access control**

- JWT bearer tokens with refresh-token rotation
- ASP.NET Core Identity with the roles `Admin`, `Manager`, and `Worker` seeded on startup
- Frontend route guards driven by role claims

## Tech stack

### Backend

- .NET 10 / ASP.NET Core (MVC controllers)
- Entity Framework Core 10 with Npgsql (Postgres provider)
- ASP.NET Core Identity + JWT bearer authentication
- SignalR for real-time hubs
- FluentValidation for request validation
- Serilog (console + rolling JSON file sink)
- QuestPDF for PDF generation
- Swashbuckle / OpenAPI for API documentation

### Frontend

- Astro 6 (SSR via the Node adapter)
- React 19 islands, TypeScript
- TanStack React Query for server state
- React Hook Form + Zod for forms and validation
- Axios with a 401-refresh interceptor
- Microsoft SignalR client for live data
- Tailwind CSS 4 (custom design tokens, dark mode via class strategy)
- Sonner for toast notifications

### Infrastructure

- Postgres 16
- nginx 1.27 as reverse proxy (production compose)
- Docker Compose for dev and production stacks
- GitHub Actions CI

## Architecture

The backend follows a four-project clean-architecture layout:

- `InvenTU.Core` — domain entities and contracts
- `InvenTU.Application` — services, validators, and use-case logic
- `InvenTU.Infrastructure` — EF Core, Identity, JWT, migrations, data seeders
- `InvenTU.Api` — ASP.NET Core controllers, SignalR hubs, middleware, OpenAPI

The frontend is an Astro 6 SSR app: static and server-rendered pages are emitted by Astro, and interactive surfaces (forms, tables, drawers, real-time widgets) hydrate as React 19 islands. The API client is a single Axios instance configured against `PUBLIC_API_BASE_URL`, and SignalR hubs are reached at `PUBLIC_HUB_URL` and `PUBLIC_ALERTS_HUB_URL`. Health checks are exposed at `/api/v1/health`, and Swagger UI is mounted in development.

## Prerequisites

- .NET 10 SDK
- Node.js 22.12 or newer
- pnpm 11
- Docker with the Compose plugin

If you run the stack via Docker Compose, only Docker is required.

## Getting started

### Option 1 — Docker Compose (recommended)

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to a value of at least 32 characters.

docker compose -f docker-compose.dev.yml up --build
```

Once the containers are healthy:

- Frontend: http://localhost:4321
- API: http://localhost:4000 (Swagger UI at `/swagger`)
- Postgres: exposed on host port `5434`

The API auto-applies EF Core migrations and runs the dev data seeders on startup in the `Development` environment.

### Option 2 — Run locally

Backend:

```bash
dotnet restore
dotnet run --project backend/InvenTU.Api
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

You will still need a running Postgres instance and a valid `.env` file pointing the API and the frontend at it.

## Environment variables

All required variables are documented in [`.env.example`](.env.example). Copy it to `.env` and, at minimum, set `JWT_SECRET` to a 32-character or longer value before starting the API.

## API documentation

- OpenAPI / Swagger UI: `http://localhost:4000/swagger` (development environment)
- Health check: `GET /api/v1/health`

## Testing

### Backend

```bash
dotnet test InvenTU.Tests/InvenTU.Tests.csproj
```

Tests use xUnit v3. Integration tests spin up a real Postgres instance via Testcontainers and reset state between tests using Respawn; unit tests use Moq.

### Frontend

```bash
cd frontend
pnpm test:e2e
```

Playwright is configured against the full Docker stack. The current spec suite covers login, dashboard, product creation, and stock receiving.

## Continuous integration

GitHub Actions runs on every push to `main` and on pull requests (`.github/workflows/ci.yml`):

- **build + test** — restores, builds in Release, and runs `dotnet test` against `InvenTU.Tests`. Test results are uploaded as `.trx` artifacts.
- **frontend e2e (chromium)** — installs frontend dependencies, installs Playwright with the chromium browser only, runs the E2E suite, and uploads the HTML report and traces.

## Project structure

- `backend/` — .NET solution (`InvenTU.Api`, `InvenTU.Application`, `InvenTU.Infrastructure`, `InvenTU.Core`)
- `frontend/` — Astro + React app, Playwright tests under `frontend/tests/e2e`
- `InvenTU.Tests/` — xUnit test project (integration + unit)
- `nginx/` — reverse proxy config used by the production compose stack
- `docker-compose.yml` — production stack (Postgres, API, frontend, nginx)
- `docker-compose.dev.yml` — development stack with hot reload and exposed ports
- `.github/workflows/` — CI pipelines

## License

Released under the GNU Affero General Public License v3.0. See [`LICENSE`](LICENSE) for the full text.
