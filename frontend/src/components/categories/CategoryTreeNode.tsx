import type { ReactNode } from 'react';
import type { CategoryDto } from '../../lib/schemas/categories';
import { Icon } from '../ui/Icon';

interface Props {
  node: CategoryDto;
  depth: number;
  expanded: Set<string>;
  filterText: string;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

const CHEVRON_BOX = 18;
const INDENT_PX = 18;
const ROW_LEFT_PAD = 12;

function highlight(text: string, filter: string): ReactNode {
  if (!filter) return text;
  const lower = text.toLowerCase();
  const needle = filter.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'var(--color-accent-tint)',
          color: 'var(--color-ink)',
          padding: '0 1px',
        }}
      >
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

export default function CategoryTreeNode({
  node,
  depth,
  expanded,
  filterText,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: Props) {
  const hasChildren = node.subCategories.length > 0;
  const isExpanded = expanded.has(node.id);
  const childCount = node.subCategories.length;
  const isRoot = depth === 0;

  return (
    <div className="flex flex-col">
      <div
        className="group flex items-center gap-2 py-2 pr-3 transition-colors hover:bg-[var(--color-shell-hover)]"
        style={{
          paddingLeft: ROW_LEFT_PAD + depth * INDENT_PX,
          minHeight: 36,
          boxShadow: isRoot ? 'inset 2px 0 0 var(--color-accent)' : undefined,
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
              flexShrink: 0,
            }}
          >
            <Icon name={isExpanded ? 'chev_down' : 'chev'} size={12} />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="inline-block"
            style={{ width: CHEVRON_BOX, height: CHEVRON_BOX, flexShrink: 0 }}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            style={{
              color: 'var(--color-ink)',
              fontSize: 13.5,
              fontWeight: isRoot ? 600 : 500,
            }}
          >
            {highlight(node.name, filterText)}
          </span>
          {node.description && (
            <span
              className="line-clamp-1"
              style={{
                color: 'var(--color-ink-3)',
                fontSize: 12,
                marginTop: 1,
              }}
            >
              {highlight(node.description, filterText)}
            </span>
          )}
        </div>

        {hasChildren && (
          <span
            className="tag tag-neutral"
            aria-label={`${childCount} subcategories`}
            style={{ flexShrink: 0 }}
          >
            {childCount}
          </span>
        )}

        <div
          className="ml-1 flex items-center gap-1 opacity-[0.35] transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          style={{ flexShrink: 0 }}
        >
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
              filterText={filterText}
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
