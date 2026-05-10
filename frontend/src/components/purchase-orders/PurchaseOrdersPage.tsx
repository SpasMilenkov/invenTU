import { useMemo } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useUrlSearchParams } from '../../lib/hooks/useUrlSearchParams';
import { useSuppliersList } from '../../lib/hooks/useSuppliers';
import { usePurchaseOrdersList } from '../../lib/hooks/usePurchaseOrders';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { PageHeader } from '../ui/PageHeader';
import PurchaseOrdersFilterBar from './PurchaseOrdersFilterBar';
import PurchaseOrdersTable from './PurchaseOrdersTable';
import {
  PurchaseOrderStatus,
  type PurchaseOrderQueryParams,
} from '../../lib/types/purchase-orders';

const CAN_MANAGE_ROLES = ['Admin', 'Manager'];
const DEFAULT_PAGE_SIZE = 20;

type UrlState = {
  supplierId: string;
  status: string;
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
};

const DEFAULTS: UrlState = {
  supplierId: '',
  status: '',
  fromDate: '',
  toDate: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function parseStatus(raw: string): PurchaseOrderStatus | undefined {
  if (raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0 || n > 3) return undefined;
  return n as PurchaseOrderStatus;
}

function PurchaseOrdersPageInner() {
  const [urlState, setUrlState] = useUrlSearchParams<UrlState>(DEFAULTS);
  const { data: me } = useCurrentUser();
  const canManage = me?.roles?.some((r) => CAN_MANAGE_ROLES.includes(r)) ?? false;

  const suppliers = useSuppliersList({});

  const queryParams: PurchaseOrderQueryParams = useMemo(
    () => ({
      supplierId: urlState.supplierId || undefined,
      status: parseStatus(urlState.status),
      fromDate: urlState.fromDate || undefined,
      toDate: urlState.toDate || undefined,
      page: urlState.page,
      pageSize: urlState.pageSize,
    }),
    [urlState],
  );

  const list = usePurchaseOrdersList(queryParams);

  const hasActiveFilters =
    urlState.supplierId !== DEFAULTS.supplierId ||
    urlState.status !== DEFAULTS.status ||
    urlState.fromDate !== DEFAULTS.fromDate ||
    urlState.toDate !== DEFAULTS.toDate;

  function clearFilters() {
    setUrlState(
      {
        supplierId: '',
        status: '',
        fromDate: '',
        toDate: '',
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

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        sub="PROCURE / PURCHASE ORDERS"
        title="Purchase orders"
        description="Track inbound orders, filter by supplier and status, and advance them through their lifecycle."
        actions={
          canManage ? (
            <a className="btn btn-primary" href="/purchase-orders/new">
              New purchase order
            </a>
          ) : null
        }
      />

      <PurchaseOrdersFilterBar
        supplierId={urlState.supplierId}
        onSupplierChange={(id) => setUrlState({ supplierId: id, page: 1 }, { historyMode: 'push' })}
        status={parseStatus(urlState.status)}
        onStatusChange={(s) =>
          setUrlState({ status: s === undefined ? '' : String(s), page: 1 }, { historyMode: 'push' })
        }
        fromDate={urlState.fromDate}
        toDate={urlState.toDate}
        onFromDateChange={(v) => setUrlState({ fromDate: v, page: 1 }, { historyMode: 'push' })}
        onToDateChange={(v) => setUrlState({ toDate: v, page: 1 }, { historyMode: 'push' })}
        suppliers={suppliers.data}
        isSuppliersLoading={suppliers.isLoading}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <PurchaseOrdersTable
        data={list.data}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRetry={() => list.refetch()}
        onPageChange={changePage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <QueryProvider>
      <PurchaseOrdersPageInner />
    </QueryProvider>
  );
}
