import type { PagedResult, UserSummary } from '../../lib/hooks/useUsers';
import { Tag } from '../ui/Tag';

interface Props {
  data?: PagedResult<UserSummary>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isAdmin: boolean;
  onEdit: (user: UserSummary) => void;
  onDeactivate: (user: UserSummary) => void;
}

export default function UsersTable({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  page,
  pageSize,
  onPageChange,
  isAdmin,
  onEdit,
  onDeactivate,
}: Props) {
  if (isError) {
    return (
      <div className="info-card" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
        <p>Could not load users.</p>
        <button type="button" className="btn btn-outline btn-sm mt-3" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  const showSkeleton = isLoading && !data;
  const items = data?.items ?? [];
  const showEmpty = !showSkeleton && items.length === 0;
  const totalCols = isAdmin ? 5 : 4;

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {showSkeleton &&
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td><div className="h-3 w-40 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} /></td>
                  <td><div className="h-3 w-56 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} /></td>
                  <td><div className="h-3 w-16 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} /></td>
                  <td><div className="h-3 w-16 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} /></td>
                  {isAdmin && <td />}
                </tr>
              ))}
            {items.map((u) => {
              const role = u.roles[0] ?? '—';
              return (
                <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                  <td className="strong">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="sku">{u.email}</td>
                  <td>
                    <Tag kind="accent">{role}</Tag>
                  </td>
                  <td>
                    <Tag kind={u.isActive ? 'ok' : 'neutral'}>
                      {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1">
                        {u.isActive && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => onEdit(u)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-crit)' }}
                              onClick={() => onDeactivate(u)}
                            >
                              Deactivate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {showEmpty && (
              <tr>
                <td
                  colSpan={totalCols}
                  style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-3)' }}
                >
                  No users yet.
                </td>
              </tr>
            )}
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
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(page + 1)}
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
