import { test as base, expect } from '@playwright/test';

/**
 * Default seeded admin credentials. Override at runtime via env vars
 * (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD). The defaults match the dev
 * seed in backend/InvenTU.Api/appsettings.Development.json.
 */
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@inventu.dev';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'DevAdmin123';

/**
 * Re-export the base test so test files can import a single `test` from
 * the project's fixtures module rather than from @playwright/test directly.
 * This is the seam where future shared fixtures will be added.
 */
export const test = base;
export { expect };

/**
 * Apply with `test.use({ storageState: STORAGE_STATE_LOGGED_OUT })` in
 * specs that exercise the login flow itself and must start unauthenticated.
 */
export const STORAGE_STATE_LOGGED_OUT: { cookies: []; origins: [] } = {
  cookies: [],
  origins: [],
};
