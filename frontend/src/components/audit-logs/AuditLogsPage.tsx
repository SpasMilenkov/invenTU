import { useMemo, useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import PageHeader from '../ui/PageHeader';
import { useUrlSearchParams } from '../../lib/hooks/useUrlSearchParams';
import { useAuditLogsList } from '../../lib/hooks/useAuditLogs';
import type {
  AuditAction,
  AuditEntityType,
  AuditLogFilters,
  AuditLogListParams,
} from '../../lib/types/auditLogs';
import AuditLogsFilterBar from './AuditLogsFilterBar';
import AuditLogsTable from './AuditLogsTable';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

type UrlState = {
  entityType: string;
  action: string;
  userId: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

const DEFAULTS: UrlState = {
  entityType: '',
  action: '',
  userId: '',
  from: '',
  to: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function parseEntityType(raw: string): AuditEntityType | undefined {
  switch (raw) {
    case 'Product':
    case 'Warehouse':
    case 'StockLocation':
    case 'User':
    case 'Category':
    case 'StockMovement':
    case 'StockItem':
    case 'Supplier':
    case 'PurchaseOrder':
    case 'PurchaseOrderLine':
    case 'UserRole':
      return raw;
    default:
      return undefined;
  }
}

function parseAction(raw: string): AuditAction | undefined {
  switch (raw) {
    case 'Insert':
    case 'Update':
    case 'Delete':
      return raw;
    default:
      return undefined;
  }
}

function AuditLogsPageInner() {
  const [urlState, setUrlState] = useUrlSearchParams<UrlState>(DEFAULTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: AuditLogFilters = useMemo(
    () => ({
      entityType: parseEntityType(urlState.entityType),
      action: parseAction(urlState.action),
      userId: urlState.userId || undefined,
      fromDate: urlState.from || undefined,
      toDate: urlState.to || undefined,
    }),
    [urlState.entityType, urlState.action, urlState.userId, urlState.from, urlState.to],
  );

  const queryParams: AuditLogListParams = useMemo(
    () => ({
      ...filters,
      page: urlState.page,
      pageSize: Math.min(MAX_PAGE_SIZE, urlState.pageSize || DEFAULT_PAGE_SIZE),
    }),
    [filters, urlState.page, urlState.pageSize],
  );

  const list = useAuditLogsList(queryParams);

  const hasActiveFilters =
    urlState.entityType !== DEFAULTS.entityType ||
    urlState.action !== DEFAULTS.action ||
    urlState.userId !== DEFAULTS.userId ||
    urlState.from !== DEFAULTS.from ||
    urlState.to !== DEFAULTS.to;

  function patchFilters(patch: Partial<UrlState>) {
    setExpandedId(null);
    setUrlState({ ...patch, page: 1 }, { historyMode: 'push' });
  }

  function clearFilters() {
    setExpandedId(null);
    setUrlState(
      {
        entityType: '',
        action: '',
        userId: '',
        from: '',
        to: '',
        page: 1,
        pageSize: urlState.pageSize,
      },
      { historyMode: 'push' },
    );
  }

  function changePage(nextPage: number) {
    if (nextPage < 1) return;
    setExpandedId(null);
    setUrlState({ page: nextPage }, { historyMode: 'push' });
  }

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        sub="ADMIN / AUDIT LOG"
        title="Audit log"
        description="Every insert, update, and delete on the core entities. Click a row to see the before / after diff."
      />

      <AuditLogsFilterBar
        entityType={urlState.entityType}
        action={urlState.action}
        userId={urlState.userId}
        from={urlState.from}
        to={urlState.to}
        onChange={patchFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <AuditLogsTable
        data={list.data}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRetry={() => list.refetch()}
        expandedId={expandedId}
        onToggleExpand={toggleExpand}
        onPageChange={changePage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <QueryProvider>
      <AuditLogsPageInner />
    </QueryProvider>
  );
}
