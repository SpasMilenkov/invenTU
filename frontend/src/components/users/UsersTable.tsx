import type { PagedResult, UserSummary } from '../../lib/hooks/useUsers';
import { roleBadgeClasses } from '../../lib/users/roleBadge';

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

const PILL_SHAPE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

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
      <div className="rounded-md border border-danger-200 bg-danger-50 p-6 text-center text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
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

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border text-left text-sm dark:divide-secondary-700">
          <thead className="bg-surface-alt text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-muted dark:bg-secondary-900/60">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              {isAdmin && <th scope="col" className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-secondary-700">
            {showSkeleton &&
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td className="px-6 py-4"><div className="h-3 w-40 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-56 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-16 animate-pulse rounded bg-surface-alt" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-16 animate-pulse rounded bg-surface-alt" /></td>
                  {isAdmin && <td className="px-6 py-4" />}
                </tr>
              ))}
            {items.map((u) => {
              const role = u.roles[0] ?? '—';
              return (
                <tr
                  key={u.id}
                  className={`transition-colors hover:bg-surface-alt dark:hover:bg-secondary-900/40 ${
                    u.isActive ? '' : 'opacity-60'
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`${PILL_SHAPE} ${roleBadgeClasses(role)}`}>{role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                              className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
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
                  colSpan={isAdmin ? 5 : 4}
                  className="px-6 py-12 text-center text-sm text-text-muted"
                >
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-surface-border px-6 py-3 text-xs text-text-muted dark:border-secondary-700">
          <span>
            Page {data.page} of {data.totalPages} · {data.totalCount} total
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
