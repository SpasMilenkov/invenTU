import { Icon } from '../ui/Icon';
import type { SupplierArchiveStatus } from '../../lib/types/suppliers';

interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  archive: SupplierArchiveStatus;
  onArchiveChange: (value: SupplierArchiveStatus) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SEGMENTS: Array<{ label: string; value: SupplierArchiveStatus }> = [
  { label: 'Active', value: 'Active' },
  { label: 'Archived', value: 'Archived' },
  { label: 'All', value: 'All' },
];

export default function SuppliersFilterBar({
  searchValue,
  onSearchChange,
  archive,
  onArchiveChange,
  onClear,
  hasActiveFilters,
}: Props) {
  return (
    <div className="toolbar">
      <div className="search">
        <Icon name="search" size={14} style={{ color: 'var(--color-ink-3)' }} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, email, phone, or address"
          aria-label="Search suppliers"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {SEGMENTS.map((seg) => {
          const selected = seg.value === archive;
          return (
            <button
              key={seg.label}
              type="button"
              className="chip"
              data-on={selected}
              onClick={() => onArchiveChange(seg.value)}
            >
              {seg.label}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
