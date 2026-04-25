import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';
import { Icon } from '../ui/Icon';
import { useCategoriesFlat, type FlatCategory } from '../../lib/hooks/useCategories';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: FieldError;
  /** When true, show ✕ inside the trigger when value is set. */
  clearable?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function CategoryPicker({
  value,
  onChange,
  error,
  clearable = false,
  placeholder = 'Select category…',
  disabled = false,
}: Props) {
  const { data: categories, isLoading, isError, refetch } = useCategoriesFlat();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const listboxId = useId();

  const selected = useMemo<FlatCategory | undefined>(
    () => (value ? categories.find((c) => c.id === value) : undefined),
    [categories, value],
  );

  const filtered = useMemo<FlatCategory[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.path.toLowerCase().includes(q));
  }, [categories, search]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSearch('');
      const idx = value ? Math.max(0, filtered.findIndex((c) => c.id === value)) : 0;
      setHighlight(idx === -1 ? 0 : idx);
      // Focus the search input after render
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
    // We intentionally only run this when `open` flips, not on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clamp highlight when filtered list shrinks
  useEffect(() => {
    if (highlight > filtered.length - 1) {
      setHighlight(filtered.length === 0 ? 0 : filtered.length - 1);
    }
  }, [filtered.length, highlight]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(
      `[data-idx="${highlight}"]`,
    );
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectAt = (idx: number) => {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.id);
    closeAndFocusTrigger();
  };

  const onTriggerClick = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onPopoverKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectAt(highlight);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAndFocusTrigger();
    } else if (e.key === 'Tab') {
      // Move focus back to the trigger so the browser's default Tab continues
      // from the trigger's tab-order position. Do NOT preventDefault — let the
      // browser advance focus from the trigger.
      triggerRef.current?.focus();
      setOpen(false);
      return;
    }
  };

  const onClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Defensive: stop propagation so a click on clear doesn't bubble to any
    // future wrapper that might react to clicks on the picker.
    e.stopPropagation();
    onChange(null);
  };

  const triggerClass = `cat-picker-trigger${error ? ' is-error' : ''}`;
  const showSkeleton = isLoading && categories.length === 0;
  const showError = isError && categories.length === 0;
  const isSearching = search.trim().length > 0;

  return (
    <div className="cat-picker" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span
          className={`cat-picker-trigger-text${selected ? '' : ' cat-picker-trigger-placeholder'}`}
        >
          {selected ? selected.path : placeholder}
        </span>
        <span className="cat-picker-chev" aria-hidden="true">
          <Icon name="chev_down" size={12} />
        </span>
      </button>
      {clearable && value && !disabled && (
        <button
          type="button"
          className="cat-picker-clear"
          aria-label="Clear selection"
          onClick={onClearClick}
        >
          <Icon name="x" size={12} />
        </button>
      )}

      {open && (
        <div className="cat-picker-popover" onKeyDown={onPopoverKeyDown}>
          <div className="cat-picker-search">
            <input
              ref={searchRef}
              type="text"
              className="input"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlight(0);
              }}
            />
          </div>

          {showSkeleton && (
            <div>
              <div className="cat-picker-skeleton" />
              <div className="cat-picker-skeleton" style={{ width: '60%' }} />
              <div className="cat-picker-skeleton" style={{ width: '75%' }} />
            </div>
          )}

          {!showSkeleton && showError && (
            <div className="cat-picker-error">
              <p>Could not load categories.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm mt-2"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {!showSkeleton && !showError && filtered.length === 0 && (
            <div className="cat-picker-empty">No categories match.</div>
          )}

          {!showSkeleton && !showError && filtered.length > 0 && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="cat-picker-list"
            >
              {filtered.map((opt, idx) => {
                const isHighlighted = idx === highlight;
                const isSelected = opt.id === value;
                const cls = [
                  'cat-picker-option',
                  isHighlighted ? 'cat-picker-option-active' : '',
                  isSelected ? 'cat-picker-option-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                const padLeft = isSearching ? 10 : 8 + opt.depth * 12;
                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    data-idx={idx}
                    className={cls}
                    style={{ paddingLeft: `${padLeft}px` }}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => selectAt(idx)}
                  >
                    <span className="cat-picker-option-path">{opt.path}</span>
                    {opt.description && opt.description.length > 0 && (
                      <span className="cat-picker-option-desc">{opt.description}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="input-error-msg">{error.message}</p>}
    </div>
  );
}
