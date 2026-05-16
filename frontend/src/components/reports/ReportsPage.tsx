import { useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import PageHeader from '../ui/PageHeader';
import ReportSection from './ReportSection';
import InventoryValuationFilters from './InventoryValuationFilters';
import StockMovementFilters from './StockMovementFilters';
import TurnoverFilters from './TurnoverFilters';
import type {
  InventoryValuationFilters as IVFilters,
  StockMovementFilters as SMFilters,
  TurnoverFilters as TNFilters,
} from '../../lib/types/reports';

const INVENTORY_VALUATION_ENDPOINTS = {
  csv: '/reports/inventory-valuation/export',
  pdf: '/reports/inventory-valuation/pdf',
};

const STOCK_MOVEMENT_ENDPOINTS = {
  csv: '/reports/stock-movement/export',
  pdf: '/reports/stock-movement/pdf',
};

const TURNOVER_ENDPOINTS = {
  csv: '/reports/turnover/export',
  pdf: '/reports/turnover/pdf',
};

export default function ReportsPage() {
  return (
    <QueryProvider>
      <ReportsPageInner />
    </QueryProvider>
  );
}

function ReportsPageInner() {
  const [valuationFilters, setValuationFilters] = useState<IVFilters>({});
  const [movementFilters, setMovementFilters] = useState<SMFilters>({});
  const [turnoverFilters, setTurnoverFilters] = useState<TNFilters>({});

  return (
    <>
      <PageHeader
        sub="ANALYZE / REPORTS"
        title="Reports"
        description="Configure filters and download report exports as CSV or PDF."
      />

      <div className="grid gap-4">
        <ReportSection
          title="Inventory Valuation"
          description="FIFO-based stock valuation across warehouses and categories. Empty filters cover everything."
          endpoints={INVENTORY_VALUATION_ENDPOINTS}
          filenameBase="inventory-valuation"
          filters={valuationFilters}
        >
          <InventoryValuationFilters value={valuationFilters} onChange={setValuationFilters} />
        </ReportSection>

        <ReportSection
          title="Stock Movement"
          description="Stock movements within a date range. Defaults to the last 30 days when no dates are set."
          endpoints={STOCK_MOVEMENT_ENDPOINTS}
          filenameBase="stock-movement"
          filters={movementFilters}
        >
          <StockMovementFilters value={movementFilters} onChange={setMovementFilters} />
        </ReportSection>

        <ReportSection
          title="Product Turnover"
          description="Annualised turnover ratio per product. Defaults to the last 90 days when no dates are set."
          endpoints={TURNOVER_ENDPOINTS}
          filenameBase="product-turnover"
          filters={turnoverFilters}
        >
          <TurnoverFilters value={turnoverFilters} onChange={setTurnoverFilters} />
        </ReportSection>
      </div>
    </>
  );
}
