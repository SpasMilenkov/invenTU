import { useEffect, useState } from 'react';
import type { WarehouseStatusFilter } from '../../lib/hooks/useWarehouses';

interface Props {
  search: string;
  status: WarehouseStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: WarehouseStatusFilter) => void;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export default function WarehousesToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search by code or name…"
        className="input max-w-xs"
        aria-label="Search warehouses"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as WarehouseStatusFilter)}
        className="select max-w-xs"
        aria-label="Filter by status"
      >
        <option value="All">All warehouses</option>
        <option value="Active">Active only</option>
        <option value="Inactive">Inactive only</option>
      </select>
    </div>
  );
}
