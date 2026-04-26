import type { CategoryDto } from '../../lib/schemas/categories';
import CategoryTreeNode from './CategoryTreeNode';

interface Props {
  roots: CategoryDto[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

export default function CategoryTree({
  roots,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: Props) {
  if (roots.length === 0) {
    return (
      <div className="panel">
        <div className="panel-body flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p style={{ color: 'var(--color-ink-3)' }}>No categories yet.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAddChild(null)}
          >
            Create your first category
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body flex flex-col gap-0.5">
        {roots.map((root) => (
          <CategoryTreeNode
            key={root.id}
            node={root}
            depth={0}
            expanded={expanded}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
