import { randomUUID } from 'node:crypto';

/**
 * Generate a SKU guaranteed unique within a single test run.
 *
 * Use in product-creation specs to avoid collisions with seeded products
 * or with previous test iterations if the database is not wiped.
 */
export function uniqueSku(prefix = 'TEST'): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}
