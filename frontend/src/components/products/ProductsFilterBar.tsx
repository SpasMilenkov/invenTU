interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
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
  isActiveFilter,
  onIsActiveChange,
  onClear,
  hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] border border-surface-border bg-surface p-4 shadow-card dark:border-secondary-700 dark:bg-secondary-800 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-xs">
          <input
            type="search"
            className="input pl-9"
            placeholder="Search SKU, name, or barcode"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </div>

        <div className="md:max-w-[14rem]" title="Available once backend exposes /api/categories">
          <select
            className="select"
            disabled
            aria-label="Filter by category"
            value=""
            onChange={() => {}}
          >
            <option value="">All categories</option>
          </select>
        </div>

        <div
          role="radiogroup"
          aria-label="Status filter"
          className="inline-flex rounded-input border border-surface-border-strong p-1 dark:border-secondary-600"
        >
          {SEGMENTS.map((seg) => {
            const selected = seg.value === isActiveFilter;
            return (
              <button
                key={seg.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onIsActiveChange(seg.value)}
                className={`rounded-[0.3rem] px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-primary-600 text-white'
                    : 'text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }`}
              >
                {seg.label}
              </button>
            );
          })}
        </div>
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
