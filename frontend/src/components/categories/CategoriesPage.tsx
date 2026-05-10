import { useMemo, useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { PageHeader } from '../ui/PageHeader';
import { Icon } from '../ui/Icon';
import { useCategoriesTree } from '../../lib/hooks/useCategories';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';
import type { CategoryDto } from '../../lib/schemas/categories';
import CategoryTree from './CategoryTree';
import CategoryFormDrawer from './CategoryFormDrawer';
import DeleteCategoryDialog from './DeleteCategoryDialog';

type DrawerState =
  | { mode: 'create'; defaultParentId: string | null }
  | { mode: 'edit'; category: CategoryDto }
  | null;

interface TreeStats {
  total: number;
  roots: number;
  maxDepth: number;
  allIds: string[];
}

function computeStats(roots: CategoryDto[]): TreeStats {
  let total = 0;
  let maxDepth = 0;
  const allIds: string[] = [];
  const visit = (node: CategoryDto, depth: number) => {
    total += 1;
    allIds.push(node.id);
    if (depth > maxDepth) maxDepth = depth;
    for (const child of node.subCategories) visit(child, depth + 1);
  };
  for (const root of roots) visit(root, 1);
  return { total, roots: roots.length, maxDepth, allIds };
}

function nodeMatches(node: CategoryDto, needle: string): boolean {
  if (node.name.toLowerCase().includes(needle)) return true;
  if (node.description && node.description.toLowerCase().includes(needle)) return true;
  return false;
}

interface FilterResult {
  roots: CategoryDto[];
  matchedAncestors: Set<string>;
}

function filterTree(roots: CategoryDto[], rawFilter: string): FilterResult {
  const needle = rawFilter.trim().toLowerCase();
  if (!needle) return { roots, matchedAncestors: new Set() };

  const matchedAncestors = new Set<string>();

  const visit = (node: CategoryDto): CategoryDto | null => {
    const keptChildren: CategoryDto[] = [];
    for (const child of node.subCategories) {
      const kept = visit(child);
      if (kept) keptChildren.push(kept);
    }
    const selfMatches = nodeMatches(node, needle);
    if (selfMatches || keptChildren.length > 0) {
      if (keptChildren.length > 0) matchedAncestors.add(node.id);
      return { ...node, subCategories: keptChildren };
    }
    return null;
  };

  const out: CategoryDto[] = [];
  for (const root of roots) {
    const kept = visit(root);
    if (kept) out.push(kept);
  }
  return { roots: out, matchedAncestors };
}

function CategoriesPageInner() {
  const { data, isLoading, isError, refetch } = useCategoriesTree();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [filterInput, setFilterInput] = useState('');
  const debouncedFilter = useDebouncedValue(filterInput, 200);

  const stats = useMemo<TreeStats>(
    () => (data ? computeStats(data) : { total: 0, roots: 0, maxDepth: 0, allIds: [] }),
    [data],
  );

  const filtered = useMemo<FilterResult>(
    () => (data ? filterTree(data, debouncedFilter) : { roots: [], matchedAncestors: new Set() }),
    [data, debouncedFilter],
  );

  const hasFilter = debouncedFilter.trim().length > 0;
  const expandedView = useMemo(() => {
    if (!hasFilter) return expanded;
    const next = new Set(expanded);
    for (const id of filtered.matchedAncestors) next.add(id);
    return next;
  }, [expanded, filtered.matchedAncestors, hasFilter]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const expandAll = () => setExpanded(new Set(stats.allIds));
  const collapseAll = () => setExpanded(new Set());

  const openCreate = (defaultParentId: string | null) =>
    setDrawer({ mode: 'create', defaultParentId });
  const openEdit = (category: CategoryDto) => setDrawer({ mode: 'edit', category });
  const openDelete = (category: CategoryDto) => setDeleteTarget(category);

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        sub="OPERATE / CATEGORIES"
        title="Categories"
        description="Browse the category hierarchy used to classify products."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate(null)}
          >
            + Add category
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="kpi">
          <div className="kpi-label">TOTAL CATEGORIES</div>
          <div className="kpi-value">{data ? stats.total.toLocaleString() : '—'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ROOT CATEGORIES</div>
          <div className="kpi-value">{data ? stats.roots.toLocaleString() : '—'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">MAX DEPTH</div>
          <div className="kpi-value">{data ? stats.maxDepth.toLocaleString() : '—'}</div>
        </div>
      </div>

      {isError ? (
        <div className="info-card">
          <p>Failed to load categories.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-3"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div className="panel-head">
            <div className="panel-title flex items-center gap-2">
              <Icon name="layers" size={14} />
              <span>CATEGORY HIERARCHY</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="search" style={{ minWidth: 220, maxWidth: 280 }}>
                <Icon name="search" size={14} style={{ color: 'var(--color-ink-3)' }} />
                <input
                  type="text"
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  placeholder="Search categories…"
                  aria-label="Search categories by name or description"
                />
                {filterInput && (
                  <button
                    type="button"
                    onClick={() => setFilterInput('')}
                    aria-label="Clear search"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-ink-3)',
                      padding: 0,
                      display: 'inline-flex',
                    }}
                  >
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={expandAll}
                disabled={!data || stats.total === 0}
              >
                Expand all
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={collapseAll}
                disabled={!data || expanded.size === 0}
              >
                Collapse all
              </button>
            </div>
          </div>

          <div className="panel-body flush" style={{ paddingBlock: 4 }}>
            {isLoading && !data ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`s-${i}`}
                    className="flex items-center gap-2 py-2"
                    style={{ paddingLeft: 12 + (i % 3) * 18, minHeight: 36 }}
                  >
                    <div
                      className="h-[18px] w-[18px] animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                    <div
                      className="h-3 animate-pulse"
                      style={{
                        background: 'var(--color-bg-sunk)',
                        width: `${140 + (i * 37) % 120}px`,
                      }}
                    />
                    <div
                      className="ml-auto mr-3 h-4 w-6 animate-pulse"
                      style={{ background: 'var(--color-bg-sunk)' }}
                    />
                  </div>
                ))}
              </div>
            ) : data ? (
              <CategoryTree
                roots={filtered.roots}
                expanded={expandedView}
                filterText={debouncedFilter.trim()}
                hasFilter={hasFilter}
                onToggle={toggleExpanded}
                onAddChild={openCreate}
                onEdit={openEdit}
                onDelete={openDelete}
                onClearFilter={() => setFilterInput('')}
              />
            ) : null}
          </div>
        </div>
      )}

      {drawer && (
        <CategoryFormDrawer
          mode={drawer.mode}
          defaultParentId={drawer.mode === 'create' ? drawer.defaultParentId : undefined}
          category={drawer.mode === 'edit' ? drawer.category : undefined}
          onClose={() => setDrawer(null)}
          onSuccess={() => setDrawer(null)}
        />
      )}

      {deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <QueryProvider>
      <CategoriesPageInner />
    </QueryProvider>
  );
}
