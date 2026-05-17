#!/usr/bin/env bash
# Boot docker-compose dev stack with a fresh Postgres volume,
# wait for API + frontend health, run Playwright, and tear down.
# Teardown runs on every exit path (success, failure, ^C).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.dev.yml"
COMPOSE=(docker compose -f "${COMPOSE_FILE}")

API_HEALTH_URL="${E2E_API_HEALTH_URL:-http://localhost:4000/api/v1/health}"
FRONTEND_URL="${E2E_BASE_URL:-http://localhost:4321}"
HEALTH_TIMEOUT_SECS="${E2E_HEALTH_TIMEOUT_SECS:-180}"

cleanup() {
  echo "==> Tearing down stack"
  "${COMPOSE[@]}" down -v --remove-orphans || true
}
trap cleanup EXIT

wait_for() {
  local url="$1"
  local label="$2"
  local deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECS ))
  echo "==> Waiting for ${label} at ${url} (timeout ${HEALTH_TIMEOUT_SECS}s)"
  until curl -fsS --max-time 5 "${url}" >/dev/null 2>&1; do
    if [ "$(date +%s)" -ge "${deadline}" ]; then
      echo "ERROR: ${label} did not become ready in ${HEALTH_TIMEOUT_SECS}s" >&2
      exit 1
    fi
    sleep 2
  done
  echo "==> ${label} ready"
}

echo "==> Dropping any existing stack and Postgres volume"
"${COMPOSE[@]}" down -v --remove-orphans

echo "==> Building and starting stack"
"${COMPOSE[@]}" up -d --build

wait_for "${API_HEALTH_URL}" "API"
wait_for "${FRONTEND_URL}" "Frontend"

cd "${REPO_ROOT}/frontend"
echo "==> Running Playwright"
exit_code=0
pnpm exec playwright test "$@" || exit_code=$?

exit "${exit_code}"
