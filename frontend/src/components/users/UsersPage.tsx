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
    <div className="flex w-full flex-col gap-5">
      <div className="page-head">
        <div>
          <div className="page-sub">ADMIN / USERS</div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
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
      </div>

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
