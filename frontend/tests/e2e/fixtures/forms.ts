import { type Page, expect } from '@playwright/test';
import { selectFirstCategory, selectFirstOption } from './selectors';

export interface ProductFormValues {
  sku: string;
  name: string;
  unitPrice: string;
  costPrice: string;
  unitOfMeasure: string;
  /** When true, picks the first warehouse from the dropdown. */
  pickWarehouse: boolean;
  /** When true, picks the first category from the popover. */
  pickCategory: boolean;
}

const DEFAULT_PRODUCT: ProductFormValues = {
  sku: 'TEST-OVERRIDE-ME',
  name: 'E2E Widget',
  unitPrice: '10',
  costPrice: '5',
  unitOfMeasure: 'each',
  pickWarehouse: true,
  pickCategory: true,
};

/**
 * Fill the product creation form on /products/new. Caller is responsible
 * for navigating to the page and clicking submit. Defaults are sane;
 * pass overrides for the value the test cares about.
 *
 * Waits for the SKU async-availability check to settle before returning,
 * so callers can safely assert on the submit button's enabled state.
 */
export async function fillProductForm(
  page: Page,
  overrides: Partial<ProductFormValues> = {},
): Promise<void> {
  const v = { ...DEFAULT_PRODUCT, ...overrides };

  await page.getByTestId('product-sku').fill(v.sku);
  await page.getByTestId('product-name').fill(v.name);

  if (v.pickCategory) {
    await selectFirstCategory(page, 'product-category');
  }

  if (v.pickWarehouse) {
    await selectFirstOption(page.getByTestId('product-warehouse'));
  }

  // Unit price + cost price (numeric inputs). Use fill().
  await page.getByTestId('product-unit-price').fill(v.unitPrice);
  await page.getByTestId('product-cost-price').fill(v.costPrice);

  // Max stock is registered with `valueAsNumber: true` and defaults to
  // undefined, which RHF coerces to NaN — failing the zod number check
  // and blocking submit. Fill a value so the form actually validates.
  // (Min stock and reorder point default to 0, so they're already valid.)
  await page.locator('#maxStockLevel').fill('100');

  // Unit of measure has no testid in the current component, and the
  // FormField wrapper renders the label as a <span> rather than a real
  // <label htmlFor>, so getByLabel won't resolve. Target the input by
  // its id, which the FormField sets to the registration name.
  const uom = page.locator('#unitOfMeasure');
  await uom.fill(v.unitOfMeasure);

  // Wait for the async SKU availability check to settle. The component
  // shows "Checking…" during the in-flight request and "✓ Available"
  // when done. Either disappearance of "Checking…" or appearance of
  // "Available" is fine; we wait for the latter when the SKU is unique.
  await expect(page.getByText(/checking…/i)).toHaveCount(0, { timeout: 5_000 }).catch(() => {});
}

export interface StockReceiveValues {
  quantity: string;
  referenceNumber?: string;
  notes?: string;
}

const DEFAULT_RECEIVE: StockReceiveValues = {
  quantity: '5',
  referenceNumber: 'PO-E2E-001',
};

/**
 * Walk the stock-receive form on /stock/receive: pick first warehouse,
 * pick first location, pick first product, set quantity, fill ref + notes.
 * Caller submits via clicking `stock-receive-submit`.
 */
export async function walkStockReceive(
  page: Page,
  overrides: Partial<StockReceiveValues> = {},
): Promise<void> {
  const v = { ...DEFAULT_RECEIVE, ...overrides };

  // Native select — pick first real option. Warehouses are async-loaded;
  // wait for at least one real option to appear before attempting select.
  const warehouse = page.getByTestId('stock-receive-warehouse');
  await expect.poll(async () => warehouse.locator('option').count(), { timeout: 10_000 }).toBeGreaterThan(1);
  await selectFirstOption(warehouse);

  // Location select is enabled only after warehouse is set; wait for both
  // enabled-ness and at least one real option to populate.
  const location = page.getByTestId('stock-receive-location');
  await expect(location).toBeEnabled({ timeout: 5_000 });
  await expect.poll(async () => location.locator('option').count(), { timeout: 10_000 }).toBeGreaterThan(1);
  await selectFirstOption(location);

  // Product select. The ProductSelector renders a search input + native select.
  // Wait for the product list to populate before picking.
  const product = page.getByTestId('stock-receive-product');
  await expect(product).toBeVisible();
  await expect.poll(async () => product.locator('option').count(), { timeout: 10_000 }).toBeGreaterThan(1);
  await selectFirstOption(product);

  // Quantity is a numeric input inside QtyStepper. Direct fill works because
  // the underlying onChange filters non-digits.
  await page.getByTestId('stock-receive-qty').fill(v.quantity);

  // Fill reference last. Filling before warehouse selection has historically
  // raced with React re-renders triggered by the async warehouse-options
  // populating into the LocationCascade <select>, leaving the input empty.
  if (v.referenceNumber !== undefined) {
    await page.getByTestId('stock-receive-ref').fill(v.referenceNumber);
  }

  if (v.notes !== undefined) {
    await page.getByTestId('stock-receive-notes').fill(v.notes);
  }
}
