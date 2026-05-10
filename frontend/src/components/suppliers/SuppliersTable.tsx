import { useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '../ui/Icon';
import { ActiveTag } from '../ui/StatusTag';
import { ConfirmModal } from '../ui/ConfirmModal';
import EmptyState from '../products/EmptyState';
import {
  useArchiveSupplier,
  useRestoreSupplier,
} from '../../lib/hooks/useSuppliers';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import type { SupplierDto } from '../../lib/types/suppliers';

interface Props {
  data?: SupplierDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onRowClick: (supplier: SupplierDto) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  canManage: boolean;
}

function rowKeyHandler(e: React.KeyboardEvent<HTMLTableRowElement>, onClick: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick();
  }
}

export default function SuppliersTable({
  data,
  isLoading,
  isError,
  onRetry,
  onRowClick,
  hasActiveFilters,
  onClearFilters,
  canManage,
}: Props) {
  const [pendingArchive, setPendingArchive] = useState<SupplierDto | null>(null);
  const [archiveError, setArchiveError] = useState<string | undefined>(undefined);
  const archiveMutation = useArchiveSupplier();
  const restoreMutation = useRestoreSupplier();

  if (isError) {
    return (
      <div className="info-card">
        <p>Could not load suppliers.</p>
        <button type="button" className="btn btn-outline btn-sm mt-3" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  const showSkeleton = isLoading && !data;
  const items = data ?? [];
  const showEmpty = !showSkeleton && items.length === 0;

  if (showEmpty) {
    return hasActiveFilters ? (
      <EmptyState
        title="No suppliers match your filters"
        description="Try a different combination or clear the filters."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    ) : (
      <EmptyState
        title="No suppliers yet"
        description="Suppliers will appear here once they are added."
      />
    );
  }

  async function confirmArchive() {
    if (!pendingArchive) return;
    setArchiveError(undefined);
    try {
      await archiveMutation.mutateAsync(pendingArchive.id);
      toast.success('Supplier archived');
      setPendingArchive(null);
    } catch (err) {
      setArchiveError(extractAuthErrorMessage(err));
    }
  }

  async function handleRestore(supplier: SupplierDto) {
    try {
      await restoreMutation.mutateAsync(supplier.id);
      toast.success('Supplier restored');
    } catch (err) {
      toast.error(extractAuthErrorMessage(err));
    }
  }

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              {canManage && <th aria-label="Actions" style={{ width: 56 }} />}
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td>
                    <div
                      className="h-3 w-40 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-48 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-28 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  <td>
                    <div
                      className="h-3 w-56 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </td>
                  {canManage && <td />}
                </tr>
              ))}
            {items.map((s) => {
              const handleClick = () => onRowClick(s);
              return (
                <tr
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(e) => rowKeyHandler(e, handleClick)}
                  className="cursor-pointer"
                  style={{ opacity: s.isActive ? 1 : 0.6 }}
                >
                  <td className="strong">
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <ActiveTag
                        active={s.isActive}
                        activeLabel="ACTIVE"
                        inactiveLabel="ARCHIVED"
                      />
                    </div>
                  </td>
                  <td>{s.contactEmail ?? '—'}</td>
                  <td className="mono">{s.contactPhone ?? '—'}</td>
                  <td style={{ wordBreak: 'break-word' }}>{s.address ?? '—'}</td>
                  {canManage && (
                    <td>
                      {s.isActive ? (
                        <button
                          type="button"
                          aria-label={`Archive ${s.name}`}
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingArchive(s);
                            setArchiveError(undefined);
                          }}
                        >
                          <Icon name="inbox" size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Restore ${s.name}`}
                          className="icon-btn"
                          disabled={
                            restoreMutation.isPending && restoreMutation.variables === s.id
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(s);
                          }}
                        >
                          <Icon name="check" size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pendingArchive && (
        <ConfirmModal
          title={`Archive ${pendingArchive.name}?`}
          body="You can restore this supplier later from the Archived filter."
          confirmLabel="Archive"
          pendingLabel="Archiving…"
          isPending={archiveMutation.isPending}
          errorMessage={archiveError}
          variant="danger"
          onConfirm={confirmArchive}
          onClose={() => {
            if (!archiveMutation.isPending) {
              setPendingArchive(null);
              setArchiveError(undefined);
            }
          }}
        />
      )}
    </div>
  );
}
