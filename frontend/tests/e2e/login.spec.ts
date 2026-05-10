import { test, expect, ADMIN_EMAIL, ADMIN_PASSWORD, STORAGE_STATE_LOGGED_OUT } from './fixtures/auth';

test.use({ storageState: STORAGE_STATE_LOGGED_OUT });

test.describe('Login', () => {
  test('admin signs in successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(ADMIN_EMAIL);
    await page.getByTestId('login-password').fill(ADMIN_PASSWORD);
    await page.getByTestId('login-submit').click();

    await page.waitForURL('/');
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'AccessToken')).toBeDefined();
  });

  test('rejects wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(ADMIN_EMAIL);
    await page.getByTestId('login-password').fill('definitely-not-the-password');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'AccessToken')).toBeUndefined();
  });

  test('blocks empty submit with client-side validation', async ({ page }) => {
    await page.goto('/login');

    // Track whether the login network call was attempted.
    let loginCalled = false;
    await page.route('**/api/v1/auth/login', async (route) => {
      loginCalled = true;
      await route.fallback();
    });

    await page.getByTestId('login-submit').click();

    // Zod errors render as sibling <p class="input-error-msg"> inside the
    // FormField wrapper. We locate via the input's parent.
    const emailErr = page.getByTestId('login-email').locator('xpath=..').locator('.input-error-msg');
    const pwErr = page.getByTestId('login-password').locator('xpath=..').locator('.input-error-msg');
    await expect(emailErr).toBeVisible();
    await expect(pwErr).toBeVisible();

    // Settle: give any potential request a beat to fire, then assert it didn't.
    await page.waitForTimeout(200);
    expect(loginCalled).toBe(false);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects invalid email format client-side', async ({ page }) => {
    await page.goto('/login');

    let loginCalled = false;
    await page.route('**/api/v1/auth/login', async (route) => {
      loginCalled = true;
      await route.fallback();
    });

    await page.getByTestId('login-email').fill('not-an-email');
    await page.getByTestId('login-password').fill('whatever');
    await page.getByTestId('login-submit').click();

    const emailErr = page.getByTestId('login-email').locator('xpath=..').locator('.input-error-msg');
    await expect(emailErr).toBeVisible();
    await page.waitForTimeout(200);
    expect(loginCalled).toBe(false);
    await expect(page).toHaveURL(/\/login$/);
  });
});
