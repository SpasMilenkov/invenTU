import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './fixtures/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FILE = path.resolve(__dirname, '..', '..', 'playwright', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('login-submit').click();

  // The app does a hard navigation via window.location.assign('/') on
  // successful login — wait for the post-login route. We assert on the
  // auth cookie rather than a rendered React element so this setup does
  // not depend on dashboard hydration succeeding (downstream specs
  // verify rendering on a per-route basis).
  await page.waitForURL('/');
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === 'AccessToken')).toBeDefined();

  await page.context().storageState({ path: AUTH_FILE });
});
