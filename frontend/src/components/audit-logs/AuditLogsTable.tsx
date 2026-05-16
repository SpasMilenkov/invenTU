import { Fragment } from 'react';
import Panel from '../ui/Panel';
import { Tag, type TagKind } from '../ui/Tag';
import type { AuditAction, AuditLogDto } from '../../lib/types/auditLogs';
import type { PagedResult } from '../../lib/hooks/useAuditLogs';
import AuditLogDiffPanel from './AuditLogDiffPanel';

interface Props {
  data?: PagedResult<AuditLogDto>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const COLUMN_COUNT = 5;

function actionTag(action: AuditAction): TagKind {
  switch (action) {
    case 'Insert':
      return 'ok';
    case 'Update':
      return 'info';
    case 'Delete':
      return 'crit';
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function rowKeyHandler(
  e: React.KeyboardEvent<HTMLTableRowElement>,
  onToggle: () => void,
) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onToggle();
  }
}

export default function AuditLogsTable({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  expandedId,
  onToggleExpand,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  if (isError) {
    return (
      <div className="info-card">
        <p>Could not load audit log.</p>
        <button type="button" className="btn btn-outline btn-sm mt-3" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  const showSkeleton = isLoading && !data;
  const items = data?.items ?? [];
  const showEmpty = !showSkeleton && items.length === 0;

  if (showEmpty) {
    return (
      <Panel flush>
        <div
          className="flex flex-col items-center text-center"
          style={{ padding: '48px 24px' }}
        >
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
            {hasActiveFilters
              ? 'No audit entries match your filters'
              : 'No audit entries yet'}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ink-3)' }}>
            {hasActiveFilters
              ? 'Try a different range or clear the filters to see everything.'
              : 'Entries appear here as records are created, updated, or deleted.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-4"
              onClick={onClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Timestamp</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Action</th>
              <th>Changed by</th>
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <td key={j}>
                      <div
                        className="h-3 animate-pulse"
                        style={{
                          background: 'var(--color-bg-sunk)',
                          width: j === 2 ? 140 : 80,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {items.map((row) => {
              const isExpanded = expandedId === row.id;
              const toggle = () => onToggleExpand(row.id);
              return (
                <Fragment key={row.id}>
                  <tr
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={toggle}
                    onKeyDown={(e) => rowKeyHandler(e, toggle)}
                    className="cursor-pointer"
                  >
                    <td className="font-mono text-[11px]">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="strong">{row.entityType}</td>
                    <td
                      className="font-mono text-[11px]"
                      style={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={row.entityId}
                    >
                      {row.entityId}
                    </td>
                    <td>
                      <Tag kind={actionTag(row.action)}>{row.action.toUpperCase()}</Tag>
                    </td>
                    <td>
                      {row.userDisplayName ?? (
                        <span style={{ color: 'var(--color-ink-3)' }}>
                          {row.userId ? row.userId : 'System'}
                        </span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={COLUMN_COUNT}
                        style={{
                          background: 'var(--color-bg-elev)',
                          padding: 16,
                        }}
                      >
                        <AuditLogDiffPanel
                          action={row.action}
                          changedFields={row.changedFields}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 font-mono text-[11px]"
          style={{
            borderTop: '1px solid var(--color-rule)',
            background: 'var(--color-bg-elev)',
            color: 'var(--color-ink-3)',
          }}
        >
          <span>
            PAGE {data.page} / {data.totalPages} · {data.totalCount} TOTAL
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(data.page - 1)}
              disabled={!data.hasPreviousPage || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(data.page + 1)}
              disabled={!data.hasNextPage || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
