import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { Tag, type TagKind } from '../ui/Tag';
import CapacityBar from './CapacityBar';
import {
  useLocationsList,
  type StockLocationSummary,
} from '../../lib/hooks/useStockLocations';

interface Props {
  warehouseId: string;
  canManage: boolean;
  onAdd: () => void;
  onEdit: (location: StockLocationSummary) => void;
  onDelete: (location: StockLocationSummary) => void;
}

interface ZoneGroup {
  key: string;
  label: string;
  locations: StockLocationSummary[];
  totalItems: number;
  totalMax: number;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

function compareSegment(a: string | null, b: string | null): number {
  const aa = (a ?? '').toLowerCase();
  const bb = (b ?? '').toLowerCase();
  if (aa < bb) return -1;
  if (aa > bb) return 1;
  return 0;
}

function sortLocations(items: readonly StockLocationSummary[]): StockLocationSummary[] {
  return [...items].sort((a, b) => {
    const z = compareSegment(a.zone, b.zone);
    if (z !== 0) return z;
    const ai = compareSegment(a.aisle, b.aisle);
    if (ai !== 0) return ai;
    const sh = compareSegment(a.shelf, b.shelf);
    if (sh !== 0) return sh;
    return compareSegment(a.bin, b.bin);
  });
}

function groupByZone(items: readonly StockLocationSummary[]): ZoneGroup[] {
  const sorted = sortLocations(items);
  const map = new Map<string, ZoneGroup>();
  for (const loc of sorted) {
    const key = loc.zone.toLowerCase();
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        label: `Zone ${loc.zone.toUpperCase()}`,
        locations: [],
        totalItems: 0,
        totalMax: 0,
      };
      map.set(key, g);
    }
    g.locations.push(loc);
    g.totalItems += loc.stockItemCount;
    g.totalMax += loc.maxCapacity;
  }
  return [...map.values()];
}

function statusForLocation(loc: StockLocationSummary): { kind: TagKind; label: string } {
  if (loc.stockItemCount === 0) return { kind: 'neutral', label: 'EMPTY' };
  if (!loc.maxCapacity) return { kind: 'ok', label: 'IN USE' };
  const pct = (loc.stockItemCount / loc.maxCapacity) * 100;
  if (pct >= 100) return { kind: 'crit', label: 'FULL' };
  if (pct >= 75) return { kind: 'warn', label: 'NEAR FULL' };
  return { kind: 'ok', label: 'IN USE' };
}

interface ZoneCardProps {
  group: ZoneGroup;
  canManage: boolean;
  onEdit: (location: StockLocationSummary) => void;
  onDelete: (location: StockLocationSummary) => void;
}

function ZoneCard({ group, canManage, onEdit, onDelete }: ZoneCardProps) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-head">
        <div className="panel-title flex items-center gap-2">
          <Icon name="layers" size={14} />
          <span>{group.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="font-mono uppercase tracking-wider"
            style={{ fontSize: 10.5, color: 'var(--color-ink-3)' }}
          >
            LOCATIONS {group.locations.length}
          </span>
          <span
            className="font-mono uppercase tracking-wider"
            style={{ fontSize: 10.5, color: 'var(--color-ink-3)' }}
          >
            ITEMS {group.totalItems.toLocaleString()}
          </span>
          <div style={{ minWidth: 160 }}>
            <CapacityBar used={group.totalItems} max={group.totalMax || null} />
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Aisle</th>
              <th>Shelf</th>
              <th>Bin</th>
              <th>Capacity</th>
              <th className="num">Items</th>
              <th>Status</th>
              {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {group.locations.map((loc) => {
              const status = statusForLocation(loc);
              return (
                <tr key={loc.id}>
                  <td className="sku">{loc.fullLocationCode}</td>
                  <td>{loc.aisle ?? '—'}</td>
                  <td>{loc.shelf ?? '—'}</td>
                  <td>{loc.bin ?? '—'}</td>
                  <td>
                    <CapacityBar used={loc.stockItemCount} max={loc.maxCapacity} />
                  </td>
                  <td className="num">{loc.stockItemCount.toLocaleString()}</td>
                  <td>
                    <Tag kind={status.kind}>{status.label}</Tag>
                  </td>
                  {canManage && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onEdit(loc)}
                        >
                          Edit
                        </button>
                        {loc.stockItemCount === 0 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-crit)' }}
                            onClick={() => onDelete(loc)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LocationTree({
  warehouseId,
  canManage,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [zoneInput, setZoneInput] = useState('');
  const debouncedZone = useDebouncedValue(zoneInput, 300);

  const { data, isLoading, isError, refetch } = useLocationsList(warehouseId, {
    zone: debouncedZone,
    enabled: true,
  });

  const groups = useMemo(() => (data ? groupByZone(data) : []), [data]);
  const hasFilter = zoneInput.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="toolbar"
        style={{ border: '1px solid var(--color-rule)', borderRadius: 2 }}
      >
        <div className="search">
          <Icon name="search" size={14} style={{ color: 'var(--color-ink-3)' }} />
          <input
            type="text"
            value={zoneInput}
            onChange={(e) => setZoneInput(e.target.value)}
            placeholder="Filter by zone…"
            aria-label="Filter locations by zone"
          />
        </div>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={onAdd}
          >
            + Add location
          </button>
        )}
      </div>

      {isError ? (
        <div className="info-card">
          <p>Failed to load locations.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-3"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : isLoading && !data ? (
        <div className="panel">
          <div className="panel-body flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`s-${i}`}
                className="h-3 w-64 animate-pulse"
                style={{ background: 'var(--color-bg-sunk)' }}
              />
            ))}
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="info-card">
          <p>
            {hasFilter
              ? 'No locations match this filter.'
              : canManage
                ? 'No locations yet — add the first one.'
                : 'No locations yet.'}
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <ZoneCard
            key={g.key}
            group={g}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
