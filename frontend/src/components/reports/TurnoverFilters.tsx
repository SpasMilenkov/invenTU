import type { TurnoverFilters as Filters } from '../../lib/types/reports';

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export default function TurnoverFilters({ value, onChange }: Props) {
  return (
    <div className="toolbar">
      <div>
        <label className="input-label" htmlFor="tn-from">From</label>
        <input
          id="tn-from"
          type="date"
          className="input"
          value={value.fromDate ?? ''}
          onChange={(e) =>
            onChange({ ...value, fromDate: e.target.value === '' ? undefined : e.target.value })
          }
        />
      </div>
      <div>
        <label className="input-label" htmlFor="tn-to">To</label>
        <input
          id="tn-to"
          type="date"
          className="input"
          value={value.toDate ?? ''}
          onChange={(e) =>
            onChange({ ...value, toDate: e.target.value === '' ? undefined : e.target.value })
          }
        />
      </div>
    </div>
  );
}
