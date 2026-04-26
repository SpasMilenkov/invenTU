import type { CategoryDto } from '../../lib/schemas/categories';
import { Icon } from '../ui/Icon';

interface Props {
  node: CategoryDto;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

const CHEVRON_BOX = 18;

export default function CategoryTreeNode({
  node,
  depth,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: Props) {
  const hasChildren = node.subCategories.length > 0;
  const isExpanded = expanded.has(node.id);
  const childCount = node.subCategories.length;

  return (
    <div className="flex flex-col">
      <div
        className="group flex items-center gap-2 py-1.5 pr-2 rounded"
        style={{
          paddingLeft: 8 + depth * 16,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
            className="inline-flex items-center justify-center rounded"
            style={{
              width: CHEVRON_BOX,
              height: CHEVRON_BOX,
              color: 'var(--color-ink-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon name={isExpanded ? 'chev_down' : 'chev'} size={12} />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="inline-block"
            style={{ width: CHEVRON_BOX, height: CHEVRON_BOX }}
          />
        )}

        <span style={{ color: 'var(--color-ink)', fontSize: 13.5 }}>{node.name}</span>

        {hasChildren && (
          <span className="tag tag-neutral" aria-label={`${childCount} subcategories`}>
            {`{${childCount}}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24 }}
            aria-label="Add child category"
            onClick={() => onAddChild(node.id)}
          >
            <Icon name="plus" size={12} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24 }}
            aria-label="Edit category"
            onClick={() => onEdit(node)}
          >
            <Icon name="edit" size={12} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24 }}
            aria-label="Delete category"
            onClick={() => onDelete(node)}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.subCategories.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
