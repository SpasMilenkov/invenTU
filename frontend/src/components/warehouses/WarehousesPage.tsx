import { useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import {
  useWarehousesList,
  useDeactivateWarehouse,
  useActivateWarehouse,
  useDeleteWarehouse,
  type WarehouseSummary,
  type WarehouseStatusFilter,
} from '../../lib/hooks/useWarehouses';
import {
  useDeleteLocation,
  type StockLocationSummary,
} from '../../lib/hooks/useStockLocations';
import WarehousesToolbar from './WarehousesToolbar';
import WarehousesTable from './WarehousesTable';
import WarehouseFormDrawer from './WarehouseFormDrawer';
import LocationFormDrawer from './LocationFormDrawer';
import ConfirmDialog from './ConfirmDialog';

const PAGE_SIZE = 20;

type WarehouseDrawerState =
  | { mode: 'create' }
  | { mode: 'edit'; warehouse: WarehouseSummary }
  | null;

type LocationDrawerState =
  | { warehouseId: string; warehouseLabel: string; mode: 'create' }
  | { warehouseId: string; warehouseLabel: string; mode: 'edit'; location: StockLocationSummary }
  | null;

type ConfirmRequest =
  | { kind: 'deactivate-warehouse'; warehouse: WarehouseSummary }
  | { kind: 'activate-warehouse'; warehouse: WarehouseSummary }
  | { kind: 'delete-warehouse'; warehouse: WarehouseSummary }
  | { kind: 'delete-location'; warehouseId: string; location: StockLocationSummary };

function buildWarehouseLabel(w: WarehouseSummary): string {
  return `${w.code} — ${w.name}`;
}

function WarehousesPageInner() {
  const { data: me } = useCurrentUser();
  const canManage = me?.roles?.some((r) => r === 'Admin' || r === 'Manager') ?? false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WarehouseStatusFilter>('All');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [warehouseDrawer, setWarehouseDrawer] = useState<WarehouseDrawerState>(null);
  const [locationDrawer, setLocationDrawer] = useState<LocationDrawerState>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);

  const list = useWarehousesList({ page, pageSize: PAGE_SIZE, search, status });
  const deactivate = useDeactivateWarehouse();
  const activate = useActivateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const deleteLocation = useDeleteLocation();

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openConfirm(req: ConfirmRequest) {
    setConfirmError(undefined);
    setConfirm(req);
  }

  function closeConfirm() {
    if (deactivate.isPending || activate.isPending || deleteWarehouse.isPending || deleteLocation.isPending) {
      return;
    }
    setConfirm(null);
    setConfirmError(undefined);
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirmError(undefined);
    try {
      if (confirm.kind === 'deactivate-warehouse') {
        await deactivate.mutateAsync(confirm.warehouse.id);
      } else if (confirm.kind === 'activate-warehouse') {
        await activate.mutateAsync(confirm.warehouse.id);
      } else if (confirm.kind === 'delete-warehouse') {
        await deleteWarehouse.mutateAsync(confirm.warehouse.id);
      } else if (confirm.kind === 'delete-location') {
        await deleteLocation.mutateAsync({
          warehouseId: confirm.warehouseId,
          id: confirm.location.id,
        });
      }
      setConfirm(null);
    } catch (err) {
      setConfirmError(extractAuthErrorMessage(err));
    }
  }

  const confirmIsPending =
    confirm?.kind === 'deactivate-warehouse'
      ? deactivate.isPending
      : confirm?.kind === 'activate-warehouse'
        ? activate.isPending
        : confirm?.kind === 'delete-warehouse'
          ? deleteWarehouse.isPending
          : confirm?.kind === 'delete-location'
            ? deleteLocation.isPending
            : false;

  let confirmTitle = '';
  let confirmBody: string = '';
  let confirmLabel = '';
  let confirmPendingLabel = '';
  let confirmVariant: 'primary' | 'danger' = 'primary';

  if (confirm?.kind === 'deactivate-warehouse') {
    const w = confirm.warehouse;
    confirmTitle = 'Deactivate warehouse';
    confirmBody = `Deactivate ${w.code} — ${w.name}? It will be hidden from the active list and writes will be blocked. You can reactivate it later.`;
    confirmLabel = 'Deactivate';
    confirmPendingLabel = 'Deactivating…';
    confirmVariant = 'danger';
  } else if (confirm?.kind === 'activate-warehouse') {
    const w = confirm.warehouse;
    confirmTitle = 'Reactivate warehouse';
    confirmBody = `Reactivate ${w.code} — ${w.name}? It will appear in the active list again.`;
    confirmLabel = 'Reactivate';
    confirmPendingLabel = 'Reactivating…';
    confirmVariant = 'primary';
  } else if (confirm?.kind === 'delete-warehouse') {
    const w = confirm.warehouse;
    confirmTitle = 'Delete warehouse';
    confirmBody = `Permanently delete ${w.code} — ${w.name}? This cannot be undone.`;
    confirmLabel = 'Delete';
    confirmPendingLabel = 'Deleting…';
    confirmVariant = 'danger';
  } else if (confirm?.kind === 'delete-location') {
    const loc = confirm.location;
    confirmTitle = 'Delete location';
    confirmBody = `Delete location ${loc.fullLocationCode}? This cannot be undone.`;
    confirmLabel = 'Delete';
    confirmPendingLabel = 'Deleting…';
    confirmVariant = 'danger';
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Inventory
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">Warehouses</h1>
          <p className="mt-1 text-sm text-text-muted">
            {canManage
              ? 'Create warehouses, organise locations, and keep capacity records current.'
              : 'Read-only view. Ask a manager to make changes.'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setWarehouseDrawer({ mode: 'create' })}
          >
            + New warehouse
          </button>
        )}
      </header>

      <WarehousesToolbar
        search={search}
        status={status}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
      />

      <WarehousesTable
        data={list.data}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRetry={() => list.refetch()}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => setPage(Math.max(1, p))}
        canManage={canManage}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onEdit={(w) => setWarehouseDrawer({ mode: 'edit', warehouse: w })}
        onDeactivate={(w) => openConfirm({ kind: 'deactivate-warehouse', warehouse: w })}
        onActivate={(w) => openConfirm({ kind: 'activate-warehouse', warehouse: w })}
        onDelete={(w) => openConfirm({ kind: 'delete-warehouse', warehouse: w })}
        onAddLocation={(w) =>
          setLocationDrawer({
            warehouseId: w.id,
            warehouseLabel: buildWarehouseLabel(w),
            mode: 'create',
          })
        }
        onEditLocation={(warehouseId, location) => {
          const w = list.data?.items.find((x) => x.id === warehouseId);
          setLocationDrawer({
            warehouseId,
            warehouseLabel: w ? buildWarehouseLabel(w) : warehouseId,
            mode: 'edit',
            location,
          });
        }}
        onDeleteLocation={(warehouseId, location) =>
          openConfirm({ kind: 'delete-location', warehouseId, location })
        }
      />

      {warehouseDrawer && (
        <WarehouseFormDrawer
          mode={warehouseDrawer.mode}
          warehouse={warehouseDrawer.mode === 'edit' ? warehouseDrawer.warehouse : undefined}
          onClose={() => setWarehouseDrawer(null)}
          onSuccess={() => setWarehouseDrawer(null)}
        />
      )}

      {locationDrawer && (
        <LocationFormDrawer
          warehouseId={locationDrawer.warehouseId}
          warehouseLabel={locationDrawer.warehouseLabel}
          mode={locationDrawer.mode}
          location={locationDrawer.mode === 'edit' ? locationDrawer.location : undefined}
          onClose={() => setLocationDrawer(null)}
          onSuccess={() => setLocationDrawer(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirmTitle}
          body={confirmBody}
          confirmLabel={confirmLabel}
          pendingLabel={confirmPendingLabel}
          confirmVariant={confirmVariant}
          isPending={confirmIsPending}
          errorMessage={confirmError}
          onConfirm={runConfirm}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
}

export default function WarehousesPage() {
  return (
    <QueryProvider>
      <WarehousesPageInner />
    </QueryProvider>
  );
}
