import { test, expect } from './fixtures/auth';
import { uniqueSku } from './fixtures/data';
import { fillProductForm } from './fixtures/forms';

test.describe('Product create', () => {
  test('creates a product with a unique SKU', async ({ page }) => {
    const sku = uniqueSku('HAPPY');
    await page.goto('/products/new');

    await fillProductForm(page, { sku });
    await page.getByTestId('product-submit').click();

    // Component does window.location.assign('/products') on success.
    await page.waitForURL(/\/products(\?.*)?$/);
    await expect(page.getByText(sku)).toBeVisible({ timeout: 10_000 });
  });

  test('rejects a duplicate SKU via async availability check', async ({ page, request }) => {
    const sku = uniqueSku('DUP');

    // Seed the duplicate via a direct API call rather than walking the
    // form twice. Two back-to-back hard navigations (form submit →
    // window.location.assign('/products') → page.goto('/products/new'))
    // race with /products page hydration on Firefox and intermittently
    // trip RouteGuard's 401-redirect, surfacing as NS_BINDING_ABORTED.
    // The happy-create test on line 6 already covers the form submit path.
    const categoriesRes = await request.get('http://localhost:4000/api/v1/categories');
    expect(categoriesRes.ok(), 'GET /categories should return seeded data').toBe(true);
    // The endpoint returns a plain tree array, not a paged envelope.
    const categories = (await categoriesRes.json()) as Array<{ id: string }>;
    const categoryId = categories[0]?.id;
    expect(categoryId, 'expected at least one seeded category').toBeTruthy();

    const seedRes = await request.post('http://localhost:4000/api/v1/products', {
      data: {
        sku,
        name: 'E2E Dup Setup',
        categoryId,
        unitPrice: 1,
        costPrice: 1,
        unitOfMeasure: 'each',
        minStockLevel: 0,
        maxStockLevel: 100,
        reorderPoint: 0,
        isActive: true,
      },
    });
    expect(seedRes.ok(), `seed POST /products failed: ${seedRes.status()}`).toBe(true);

    // Single navigation: open the form and verify the duplicate-SKU UX.
    await page.goto('/products/new');
    await page.getByTestId('product-sku').fill(sku);

    // Wait past the 400ms debounce + lookup. The component renders
    // "SKU already in use" as a field error and disables submit.
    await expect(page.getByText(/sku already in use/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('product-submit')).toBeDisabled();
  });

  test('blocks submit when required fields are missing', async ({ page }) => {
    await page.goto('/products/new');

    // Submit immediately with everything blank. Zod validation must trigger
    // and prevent navigation.
    await page.getByTestId('product-submit').click();

    // The form has zodResolver wired; field errors render via FormField.
    // Assert URL did not change (no successful redirect).
    await expect(page).toHaveURL(/\/products\/new$/);

    // Sanity-check that an error message surfaces beneath the SKU field.
    const skuErr = page.getByTestId('product-sku').locator('xpath=..').locator('.input-error-msg');
    await expect(skuErr).toBeVisible();
  });

  test('surfaces a toast when the server returns 500', async ({ page }) => {
    // Scope mock to POST only — GET /products is used by SKU availability.
    await page.route('**/api/v1/products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/products/new');
    await fillProductForm(page, { sku: uniqueSku('SRVERR') });
    await page.getByTestId('product-submit').click();

    // The page falls back to toast.error(extractAuthErrorMessage(err)).
    // Sonner renders into a portal; the message lands in the document body.
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5_000 });

    // URL should stay on the create form.
    await expect(page).toHaveURL(/\/products\/new$/);
  });
});
