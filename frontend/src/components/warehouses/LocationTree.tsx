import { useEffect, useMemo, useState } from 'react';
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

interface TreeNode {
  key: string;
  label: string;
  location?: StockLocationSummary;
  children: TreeNode[];
}

const UNSPECIFIED_KEY = 'unspecified';

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

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function findOrCreateChild(parent: TreeNode, key: string, label: string): TreeNode {
  const existing = parent.children.find((c) => c.key === key && !c.location);
  if (existing) return existing;
  const node: TreeNode = { key, label, children: [] };
  parent.children.push(node);
  return node;
}

function buildTree(items: readonly StockLocationSummary[]): TreeNode[] {
  const sorted = sortLocations(items);
  const roots: TreeNode[] = [];

  for (const loc of sorted) {
    const zoneLabel = `Zone ${capitalizeFirst(loc.zone)}`;
    const zoneKey = `zone:${loc.zone.toLowerCase()}`;

    let zoneNode = roots.find((n) => n.key === zoneKey && !n.location);
    if (!zoneNode) {
      zoneNode = { key: zoneKey, label: zoneLabel, children: [] };
      roots.push(zoneNode);
    }

    if (loc.aisle === null && loc.shelf === null && loc.bin === null) {
      zoneNode.children.push({
        key: `leaf:${loc.id}`,
        label: zoneLabel,
        location: loc,
        children: [],
      });
      continue;
    }

    const aisleLabel = loc.aisle ? `Aisle ${capitalizeFirst(loc.aisle)}` : 'Aisle —';
    const aisleKey = `aisle:${(loc.aisle ?? UNSPECIFIED_KEY).toLowerCase()}`;
    const aisleNode = findOrCreateChild(zoneNode, aisleKey, aisleLabel);

    if (loc.shelf === null && loc.bin === null) {
      aisleNode.children.push({
        key: `leaf:${loc.id}`,
        label: aisleLabel,
        location: loc,
        children: [],
      });
      continue;
    }

    const shelfLabel = loc.shelf ? `Shelf ${capitalizeFirst(loc.shelf)}` : 'Shelf —';
    const shelfKey = `shelf:${(loc.shelf ?? UNSPECIFIED_KEY).toLowerCase()}`;
    const shelfNode = findOrCreateChild(aisleNode, shelfKey, shelfLabel);

    if (loc.bin === null) {
      shelfNode.children.push({
        key: `leaf:${loc.id}`,
        label: shelfLabel,
        location: loc,
        children: [],
      });
      continue;
    }

    shelfNode.children.push({
      key: `leaf:${loc.id}`,
      label: `Bin ${capitalizeFirst(loc.bin)}`,
      location: loc,
      children: [],
    });
  }

  return roots;
}

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  canManage: boolean;
  onEdit: (location: StockLocationSummary) => void;
  onDelete: (location: StockLocationSummary) => void;
}

function TreeRow({ node, depth, canManage, onEdit, onDelete }: TreeRowProps) {
  const indentClass =
    depth === 0 ? '' : depth === 1 ? 'pl-4' : depth === 2 ? 'pl-8' : depth === 3 ? 'pl-12' : 'pl-16';
  const loc = node.location;

  return (
    <li>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface-alt dark:hover:bg-secondary-900/40 ${indentClass}`}
      >
        <span className="font-medium text-text-primary">{node.label}</span>
        {loc && (
          <>
            <span className="font-mono text-xs text-text-muted">{loc.fullLocationCode}</span>
            <span className="text-xs text-text-muted">capacity: {loc.maxCapacity}</span>
            <span className="text-xs text-text-muted">items: {loc.stockItemCount}</span>
            {canManage && (
              <span className="ml-auto flex items-center gap-1">
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
                    className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                    onClick={() => onDelete(loc)}
                  >
                    Delete
                  </button>
                )}
              </span>
            )}
          </>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {node.children.map((child) => (
            <TreeRow
              key={child.key}
              node={child}
              depth={depth + 1}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
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

  const tree = useMemo(() => (data ? buildTree(data) : []), [data]);
  const hasFilter = zoneInput.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-surface-border bg-surface-alt/40 p-4 dark:border-secondary-700 dark:bg-secondary-900/30">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={zoneInput}
          onChange={(e) => setZoneInput(e.target.value)}
          placeholder="Filter by zone…"
          className="input max-w-xs"
          aria-label="Filter locations by zone"
        />
        {canManage && (
          <button
            type="button"
            className="btn btn-primary ml-auto"
            onClick={onAdd}
          >
            + Add location
          </button>
        )}
      </div>

      {isError ? (
        <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-center text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
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
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={`skeleton-${i}`} className="px-2 py-1.5">
              <div className="h-3 w-64 animate-pulse rounded bg-surface-alt dark:bg-secondary-800" />
            </li>
          ))}
        </ul>
      ) : tree.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-text-muted">
          {hasFilter
            ? 'No locations match this filter.'
            : canManage
              ? 'No locations yet — add the first one.'
              : 'No locations yet.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tree.map((node) => (
            <TreeRow
              key={node.key}
              node={node}
              depth={0}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
