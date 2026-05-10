import { useEffect, useState } from 'react';
import type { WarehouseStatusFilter } from '../../lib/hooks/useWarehouses';
import { Icon } from '../ui/Icon';

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

const STATUSES: { value: WarehouseStatusFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

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
    <div className="toolbar">
      <div className="search">
        <Icon name="search" size={14} style={{ color: 'var(--color-ink-3)' }} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by code or name…"
          aria-label="Search warehouses"
        />
      </div>
      <div className="flex items-center gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            className="chip"
            data-on={status === s.value}
            onClick={() => onStatusChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
