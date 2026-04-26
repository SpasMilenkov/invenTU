import { useEffect, useMemo, useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';
import { useUrlSearchParams } from '../../lib/hooks/useUrlSearchParams';
import {
  useProductsList,
  useProductStockSummaries,
} from '../../lib/hooks/useProducts';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import type { ArchiveStatusFilter, ProductQueryParams, StockSummary } from '../../lib/types/products';
import ProductsFilterBar from './ProductsFilterBar';
import ProductsTable from './ProductsTable';
import { PageHeader } from '../ui/PageHeader';

const DEFAULT_PAGE_SIZE = 20;
const CAN_MANAGE_ROLES = ['Admin', 'Manager'];

type UrlState = {
  search: string;
  categoryId: string;
  archive: ArchiveStatusFilter;
  page: number;
  pageSize: number;
};

const DEFAULTS: UrlState = {
  search: '',
  categoryId: '',
  archive: 'Active',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function parseArchive(raw: string): ArchiveStatusFilter {
  if (raw === 'Archived' || raw === 'All') return raw;
  return 'Active';
}

function ProductsPageInner() {
  const [urlState, setUrlState] = useUrlSearchParams<UrlState>(DEFAULTS);
  const { data: me } = useCurrentUser();
  const canManage = me?.roles?.some((r) => CAN_MANAGE_ROLES.includes(r)) ?? false;

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
      categoryId: urlState.categoryId || undefined,
      archive: parseArchive(urlState.archive),
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
    urlState.categoryId !== DEFAULTS.categoryId ||
    urlState.archive !== DEFAULTS.archive ||
    urlState.page !== DEFAULTS.page;

  function clearFilters() {
    setSearchInput('');
    setUrlState(
      {
        search: '',
        categoryId: '',
        archive: DEFAULTS.archive,
        page: 1,
        pageSize: DEFAULTS.pageSize,
      },
      { historyMode: 'push' },
    );
  }

  function changePage(nextPage: number) {
    if (nextPage < 1) return;
    setUrlState({ page: nextPage }, { historyMode: 'push' });
  }

  function changeArchive(value: ArchiveStatusFilter) {
    setUrlState({ archive: value, page: 1 }, { historyMode: 'push' });
  }

  function changeCategory(id: string | null) {
    setUrlState({ categoryId: id ?? '', page: 1 }, { historyMode: 'push' });
  }

  function rowClick(id: string) {
    window.location.assign(`/products/${id}`);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        sub="OPERATE / PRODUCTS"
        title="Products"
        description="Browse the catalogue, filter by status, and open a product to see stock-on-hand and act on it."
        actions={
          canManage ? (
            <a className="btn btn-primary" href="/products/new">
              New product
            </a>
          ) : null
        }
      />

      <ProductsFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        categoryId={urlState.categoryId || null}
        onCategoryChange={changeCategory}
        archive={parseArchive(urlState.archive)}
        onArchiveChange={changeArchive}
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
