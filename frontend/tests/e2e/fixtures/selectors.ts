import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Pick the first option in the CategoryPicker popover. The picker is a
 * custom button + listbox combo (NOT a native select), so we open it,
 * wait for the listbox to be visible, then click the first option.
 *
 * The picker is identified by the wrapper `data-testid` from the
 * containing form (e.g. "product-category" on the product create page).
 */
export async function selectFirstCategory(page: Page, wrapperTestId: string): Promise<void> {
  const wrapper = page.getByTestId(wrapperTestId);
  // The wrapper renders a trigger button (and optionally a clear-X button
  // when a value is set). The trigger is always first in DOM order.
  await wrapper.getByRole('button').first().click();

  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await listbox.getByRole('option').first().click();
}

/**
 * Pick the first non-placeholder option in a native `<select>`.
 * Throws if there are no real options (only the placeholder).
 */
export async function selectFirstOption(select: Locator): Promise<string> {
  const options = await select.locator('option').all();
  if (options.length < 2) {
    throw new Error('selectFirstOption: only placeholder option present');
  }
  const value = await options[1].getAttribute('value');
  if (!value) throw new Error('selectFirstOption: first real option has no value');
  await select.selectOption(value);
  return value;
}
