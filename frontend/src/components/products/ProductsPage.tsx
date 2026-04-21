import { useEffect, useMemo, useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';
import { useUrlSearchParams } from '../../lib/hooks/useUrlSearchParams';
import {
  useProductsList,
  useProductStockSummaries,
} from '../../lib/hooks/useProducts';
import type { ProductQueryParams, StockSummary } from '../../lib/types/products';
import ProductsFilterBar from './ProductsFilterBar';
import ProductsTable from './ProductsTable';

const DEFAULT_PAGE_SIZE = 20;

type UrlState = {
  search: string;
  isActive: string;
  page: number;
  pageSize: number;
};

const DEFAULTS: UrlState = {
  search: '',
  isActive: 'true',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function parseIsActive(raw: string): boolean | undefined {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

function stringifyIsActive(value: boolean | undefined): string {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'all';
}

function ProductsPageInner() {
  const [urlState, setUrlState] = useUrlSearchParams<UrlState>(DEFAULTS);

  // Local search state for responsive typing, debounced into URL/query.
  const [searchInput, setSearchInput] = useState(urlState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryParams: ProductQueryParams = useMemo(
    () => ({
      search: urlState.search || undefined,
      isActive: parseIsActive(urlState.isActive),
      page: urlState.page,
      pageSize: urlState.pageSize,
    }),
    [urlState],
  );

  const list = useProductsList(queryParams);

  const productIds = useMemo(() => list.data?.items.map((p) => p.id) ?? [], [list.data]);
  const stockQueries = useProductStockSummaries(productIds);

  const stockLookup = useMemo(() => {
    const byProductId = new Map<string, StockSummary>();
    const statusById = new Map<string, { isLoading: boolean; isError: boolean }>();
    productIds.forEach((id, idx) => {
      const q = stockQueries[idx];
      if (q?.data) byProductId.set(id, q.data);
      statusById.set(id, { isLoading: q?.isLoading ?? false, isError: q?.isError ?? false });
    });
    return {
      byProductId,
      isLoadingForProduct: (id: string) => statusById.get(id)?.isLoading ?? false,
      isErrorForProduct: (id: string) => statusById.get(id)?.isError ?? false,
    };
  }, [productIds, stockQueries]);

  const hasActiveFilters =
    urlState.search !== DEFAULTS.search ||
    urlState.isActive !== DEFAULTS.isActive ||
    urlState.page !== DEFAULTS.page;

  function clearFilters() {
    setSearchInput('');
    setUrlState(
      { search: '', isActive: DEFAULTS.isActive, page: 1, pageSize: DEFAULTS.pageSize },
      { historyMode: 'push' },
    );
  }

  function changePage(nextPage: number) {
    if (nextPage < 1) return;
    setUrlState({ page: nextPage }, { historyMode: 'push' });
  }

  function changeIsActive(value: boolean | undefined) {
    setUrlState({ isActive: stringifyIsActive(value), page: 1 }, { historyMode: 'push' });
  }

  function rowClick(id: string) {
    window.location.assign(`/products/${id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Inventory
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Products</h1>
        <p className="mt-1 text-sm text-text-muted">
          Browse the catalogue, filter by status, and open a product to see stock-on-hand and act on it.
        </p>
      </header>

      <ProductsFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        isActiveFilter={parseIsActive(urlState.isActive)}
        onIsActiveChange={changeIsActive}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ProductsTable
        data={list.data}
        stock={stockLookup}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRetry={() => list.refetch()}
        onRowClick={rowClick}
        onPageChange={changePage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <QueryProvider>
      <ProductsPageInner />
    </QueryProvider>
  );
}
