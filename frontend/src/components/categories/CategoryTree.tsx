import type { CategoryDto } from '../../lib/schemas/categories';
import CategoryTreeNode from './CategoryTreeNode';

interface Props {
  roots: CategoryDto[];
  expanded: Set<string>;
  filterText: string;
  hasFilter: boolean;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
  onClearFilter: () => void;
}

export default function CategoryTree({
  roots,
  expanded,
  filterText,
  hasFilter,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onClearFilter,
}: Props) {
  if (roots.length === 0) {
    if (hasFilter) {
      return (
        <div className="info-card">
          <p>No categories match this search.</p>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3"
            onClick={onClearFilter}
          >
            Clear search
          </button>
        </div>
      );
    }
    return (
      <div className="info-card">
        <p>No categories yet.</p>
        <button
          type="button"
          className="btn btn-primary btn-sm mt-3"
          onClick={() => onAddChild(null)}
        >
          Create your first category
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {roots.map((root) => (
        <CategoryTreeNode
          key={root.id}
          node={root}
          depth={0}
          expanded={expanded}
          filterText={filterText}
          onToggle={onToggle}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
