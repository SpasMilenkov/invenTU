import { test, expect } from './fixtures/auth';
import { walkStockReceive } from './fixtures/forms';
import { selectFirstOption } from './fixtures/selectors';

test.describe('Stock receive', () => {
  test('records a receipt end-to-end', async ({ page }) => {
    await page.goto('/stock/receive');

    await walkStockReceive(page, { quantity: '5', referenceNumber: 'PO-E2E-001' });

    // Defensive: confirm the reference made it into the form. Helps diagnose
    // RHF/Controller races if this test ever regresses.
    await expect(page.getByTestId('stock-receive-ref')).toHaveValue('PO-E2E-001');

    const submit = page.getByTestId('stock-receive-submit');
    await expect(submit).toBeEnabled();
    await submit.click();

    const confirmation = page.getByTestId('stock-receive-confirmation');
    await expect(confirmation).toBeVisible({ timeout: 10_000 });
    await expect(confirmation).toContainText(/\+5|5/);
    await expect(confirmation).toContainText(/PO-E2E-001/);
  });

  test('keeps submit disabled until the form is complete', async ({ page }) => {
    await page.goto('/stock/receive');

    const submit = page.getByTestId('stock-receive-submit');
    await expect(submit).toBeDisabled();

    // Pick warehouse only. Wait for async-loaded options to populate first.
    const warehouse = page.getByTestId('stock-receive-warehouse');
    await expect
      .poll(async () => warehouse.locator('option').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);
    await selectFirstOption(warehouse);
    await expect(submit).toBeDisabled();

    // Pick location. Locations load after warehouse is selected.
    const location = page.getByTestId('stock-receive-location');
    await expect(location).toBeEnabled();
    await expect
      .poll(async () => location.locator('option').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);
    await selectFirstOption(location);
    await expect(submit).toBeDisabled();

    // Pick product (qty still 0). Wait for products to populate.
    const product = page.getByTestId('stock-receive-product');
    await expect
      .poll(async () => product.locator('option').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);
    await selectFirstOption(product);
    await expect(submit).toBeDisabled();

    // Set qty > 0 — now enabled.
    await page.getByTestId('stock-receive-qty').fill('5');
    await expect(submit).toBeEnabled();
  });

  test('does not submit when quantity is zero', async ({ page }) => {
    await page.goto('/stock/receive');

    // Walk the form with qty explicitly set to 0.
    await walkStockReceive(page, { quantity: '0' });

    await expect(page.getByTestId('stock-receive-submit')).toBeDisabled();
  });

  test('clears location selection when the warehouse changes', async ({ page }) => {
    await page.goto('/stock/receive');

    const warehouseSelect = page.getByTestId('stock-receive-warehouse');
    const locationSelect = page.getByTestId('stock-receive-location');

    // Wait for warehouses to async-load before reading options.
    await expect
      .poll(async () => warehouseSelect.locator('option').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);

    // Read the available warehouse options. We need at least two to make
    // this assertion meaningful. The seed creates multiple warehouses;
    // if only one exists the test is skipped.
    const warehouseOptionValues = await warehouseSelect.locator('option').evaluateAll(
      (options) => options.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== ''),
    );
    test.skip(warehouseOptionValues.length < 2, 'Needs at least 2 seeded warehouses');

    // Pick warehouse A, pick a location.
    await warehouseSelect.selectOption(warehouseOptionValues[0]);
    await expect(locationSelect).toBeEnabled();
    await expect
      .poll(async () => locationSelect.locator('option').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);
    await selectFirstOption(locationSelect);
    await expect(locationSelect).not.toHaveValue('');

    // Switch to warehouse B.
    await warehouseSelect.selectOption(warehouseOptionValues[1]);

    // Component's handleWarehouseChange clears stockLocationId.
    await expect(locationSelect).toHaveValue('');
  });
});
