import { test, expect } from './fixtures/auth';

test.describe('Dashboard', () => {
  test('renders heading and four sections', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('dashboard-heading')).toBeVisible();
    await expect(page.getByTestId('dashboard-kpis')).toBeVisible();
    await expect(page.getByTestId('dashboard-chart')).toBeVisible();
    await expect(page.getByTestId('dashboard-recent-movements')).toBeVisible();
    await expect(page.getByTestId('dashboard-live-feed')).toBeVisible();
  });

  test('kpi cards render numeric values once stats resolve', async ({ page }) => {
    await page.goto('/');

    const kpis = page.getByTestId('dashboard-kpis');
    await expect(kpis).toBeVisible();

    // Wait for at least one digit to land inside the KPI block (proves stats
    // resolved out of the skeleton state). Generous timeout: API + 3 queries.
    await expect(kpis).toContainText(/\d/, { timeout: 15_000 });
  });

  test('chart hydrates out of skeleton state', async ({ page }) => {
    await page.goto('/');

    const chart = page.getByTestId('dashboard-chart');
    await expect(chart).toBeVisible();

    // The loaded StockByCategoryChart renders the panel title "Stock by
    // Category" inside a <span class="panel-title">. The ChartSkeleton uses
    // a SkeletonBar in place of that title, so this text only appears once
    // dashboard data resolves.
    await expect(chart.getByText(/Stock by Category/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows retry banner when stats endpoint fails', async ({ page }) => {
    await page.route('**/api/v1/stats/inventory-health', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/');

    // The stats-side ErrorBanner sits above the KPI grid when statsError is true.
    await expect(page.getByRole('button', { name: /retry/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Other sections should still render — only one of three stats endpoints failed.
    await expect(page.getByTestId('dashboard-chart')).toBeVisible();
    await expect(page.getByTestId('dashboard-recent-movements')).toBeVisible();
  });
});
