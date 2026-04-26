import CategoryPicker from '../categories/CategoryPicker';
import { Icon } from '../ui/Icon';

interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  isActiveFilter: boolean | undefined;
  onIsActiveChange: (value: boolean | undefined) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SEGMENTS: Array<{ label: string; value: boolean | undefined }> = [
  { label: 'Active', value: true },
  { label: 'Archived', value: false },
  { label: 'All', value: undefined },
];

export default function ProductsFilterBar({
  searchValue,
  onSearchChange,
  categoryId,
  onCategoryChange,
  isActiveFilter,
  onIsActiveChange,
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
          placeholder="Search SKU, name, or barcode"
          aria-label="Search products"
        />
      </div>

      <div className="md:w-80">
        <CategoryPicker
          value={categoryId}
          onChange={onCategoryChange}
          clearable
          placeholder="All categories"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {SEGMENTS.map((seg) => {
          const selected = seg.value === isActiveFilter;
          return (
            <button
              key={seg.label}
              type="button"
              className="chip"
              data-on={selected}
              onClick={() => onIsActiveChange(seg.value)}
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
