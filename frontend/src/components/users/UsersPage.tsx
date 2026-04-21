import { useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import {
  useUsersList,
  useDeactivateUser,
  type UserSummary,
} from '../../lib/hooks/useUsers';
import UsersTable from './UsersTable';
import UserFormDrawer from './UserFormDrawer';
import DeactivateConfirm from './DeactivateConfirm';

const PAGE_SIZE = 20;

type DrawerState =
  | { mode: 'create' }
  | { mode: 'edit'; user: UserSummary }
  | null;

function UsersPageInner() {
  const { data: me } = useCurrentUser();
  const isAdmin = me?.roles?.includes('Admin') ?? false;

  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [deactivating, setDeactivating] = useState<UserSummary | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | undefined>(undefined);

  const list = useUsersList({ page, pageSize: PAGE_SIZE });
  const deactivate = useDeactivateUser();

  async function confirmDeactivate() {
    if (!deactivating) return;
    setDeactivateError(undefined);
    try {
      await deactivate.mutateAsync(deactivating.id);
      setDeactivating(null);
    } catch (err) {
      setDeactivateError(extractAuthErrorMessage(err));
    }
  }

  function openDeactivate(user: UserSummary) {
    setDeactivateError(undefined);
    setDeactivating(user);
  }

  function closeDeactivate() {
    if (deactivate.isPending) return;
    setDeactivating(null);
    setDeactivateError(undefined);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Team
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">Users</h1>
          <p className="mt-1 text-sm text-text-muted">
            {isAdmin
              ? 'Create accounts, assign roles, and deactivate members who leave.'
              : 'Read-only view of team members. Ask an administrator to make changes.'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setDrawer({ mode: 'create' })}
          >
            + New user
          </button>
        )}
      </header>

      <UsersTable
        data={list.data}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRetry={() => list.refetch()}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => setPage(Math.max(1, p))}
        isAdmin={isAdmin}
        onEdit={(user) => setDrawer({ mode: 'edit', user })}
        onDeactivate={openDeactivate}
      />

      {drawer && (
        <UserFormDrawer
          mode={drawer.mode}
          user={drawer.mode === 'edit' ? drawer.user : undefined}
          onClose={() => setDrawer(null)}
          onSuccess={() => setDrawer(null)}
        />
      )}

      {deactivating && (
        <DeactivateConfirm
          user={deactivating}
          isPending={deactivate.isPending}
          errorMessage={deactivateError}
          onConfirm={confirmDeactivate}
          onClose={closeDeactivate}
        />
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <QueryProvider>
      <UsersPageInner />
    </QueryProvider>
  );
}
