import { useEffect, useMemo, useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';
import { useUrlSearchParams } from '../../lib/hooks/useUrlSearchParams';
import { useSuppliersList } from '../../lib/hooks/useSuppliers';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { PageHeader } from '../ui/PageHeader';
import SuppliersFilterBar from './SuppliersFilterBar';
import SuppliersTable from './SuppliersTable';
import SupplierFormDrawer from './SupplierFormDrawer';
import type { SupplierArchiveStatus, SupplierDto } from '../../lib/types/suppliers';

const CAN_MANAGE_ROLES = ['Admin', 'Manager'];
const ADMIN_ROLES = ['Admin'];

type UrlState = {
  search: string;
  archive: SupplierArchiveStatus;
};

const DEFAULTS: UrlState = { search: '', archive: 'Active' };

function parseArchive(raw: string): SupplierArchiveStatus {
  if (raw === 'Archived' || raw === 'All') return raw;
  return 'Active';
}

function SuppliersPageInner() {
  const [urlState, setUrlState] = useUrlSearchParams<UrlState>(DEFAULTS);
  const { data: me } = useCurrentUser();
  const canManage = me?.roles?.some((r) => CAN_MANAGE_ROLES.includes(r)) ?? false;
  const canDelete = me?.roles?.some((r) => ADMIN_ROLES.includes(r)) ?? false;

  const [searchInput, setSearchInput] = useState(urlState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const list = useSuppliersList(useMemo(() => ({
    search: urlState.search || undefined,
    archive: parseArchive(urlState.archive),
  }), [urlState.search, urlState.archive]));

  const [editing, setEditing] = useState<SupplierDto | null>(null);

  const hasActiveFilters =
    urlState.search !== DEFAULTS.search || urlState.archive !== DEFAULTS.archive;

  function clearFilters() {
    setSearchInput('');
    setUrlState({ search: '', archive: 'Active' }, { historyMode: 'push' });
  }

  function changeArchive(value: SupplierArchiveStatus) {
    setUrlState({ archive: value }, { historyMode: 'push' });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        sub="PROCURE / SUPPLIERS"
        title="Suppliers"
        description="Manage the supplier directory and contact information."
        actions={
          canManage ? (
            <a className="btn btn-primary" href="/suppliers/new">
              New supplier
            </a>
          ) : null
        }
      />

      <SuppliersFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        archive={parseArchive(urlState.archive)}
        onArchiveChange={changeArchive}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <SuppliersTable
        data={list.data}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        onRowClick={(s) => setEditing(s)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        canManage={canManage}
      />

      {editing && (
        <SupplierFormDrawer
          supplier={editing}
          canDelete={canDelete}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <QueryProvider>
      <SuppliersPageInner />
    </QueryProvider>
  );
}
