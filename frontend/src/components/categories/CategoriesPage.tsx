import { useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { PageHeader } from '../ui/PageHeader';
import { useCategoriesTree } from '../../lib/hooks/useCategories';
import type { CategoryDto } from '../../lib/schemas/categories';
import CategoryTree from './CategoryTree';
import CategoryFormDrawer from './CategoryFormDrawer';
import DeleteCategoryDialog from './DeleteCategoryDialog';

type DrawerState =
  | { mode: 'create'; defaultParentId: string | null }
  | { mode: 'edit'; category: CategoryDto }
  | null;

function CategoriesPageInner() {
  const { data, isLoading, isError, refetch } = useCategoriesTree();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
      ) : isLoading && !data ? (
        <div className="panel">
          <div className="panel-body flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`s-${i}`}
                className="h-3 w-64 animate-pulse"
                style={{ background: 'var(--color-bg-sunk)' }}
              />
            ))}
          </div>
        </div>
      ) : data ? (
        <CategoryTree
          roots={data}
          expanded={expanded}
          onToggle={toggleExpanded}
          onAddChild={openCreate}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      ) : null}

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
