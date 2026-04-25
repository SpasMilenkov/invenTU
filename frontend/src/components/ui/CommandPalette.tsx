import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';

interface CommandItem {
  id: string;
  label: string;
  glyph: IconName;
  href: string;
  meta?: string;
}

interface CommandGroup {
  group: string;
  items: CommandItem[];
}

const COMMANDS: CommandGroup[] = [
  {
    group: 'Navigation',
    items: [
      { id: 'go-dashboard', label: 'Go to Dashboard', glyph: 'grid', href: '/dashboard', meta: 'G D' },
      { id: 'go-products', label: 'Go to Products', glyph: 'box', href: '/products', meta: 'G P' },
      { id: 'go-warehouses', label: 'Go to Warehouses', glyph: 'warehouse', href: '/warehouses', meta: 'G W' },
      { id: 'go-stock', label: 'Go to Stock Operations', glyph: 'scan', href: '/stock', meta: 'G S' },
      { id: 'go-suppliers', label: 'Go to Suppliers', glyph: 'truck', href: '/suppliers', meta: 'G L' },
      { id: 'go-reports', label: 'Go to Reports', glyph: 'chart', href: '/reports', meta: 'G R' },
      { id: 'go-users', label: 'Go to Users', glyph: 'users', href: '/users', meta: 'G U' },
      { id: 'go-profile', label: 'Go to Profile', glyph: 'user', href: '/profile', meta: '' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { id: 'a-receive', label: 'Receive shipment', glyph: 'inbox', href: '/stock/receive', meta: '↵' },
      { id: 'a-issue', label: 'Issue stock', glyph: 'arrow', href: '/stock/issue', meta: '↵' },
      { id: 'a-transfer', label: 'Transfer between locations', glyph: 'arrow', href: '/stock/transfer', meta: '↵' },
      { id: 'a-adjust', label: 'Adjust on-hand quantity', glyph: 'settings', href: '/stock/adjustments', meta: '↵' },
      { id: 'a-warehouse', label: 'Manage warehouses', glyph: 'warehouse', href: '/warehouses', meta: '↵' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !q || it.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);
  const flatItems = groups.flatMap((g) => g.items);

  useEffect(() => {
    if (open) {
      setQuery('');
      setFocus(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocus((f) => Math.min(flatItems.length - 1, f + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocus((f) => Math.max(0, f - 1));
      } else if (e.key === 'Enter') {
        const it = flatItems[focus];
        if (it) {
          window.location.assign(it.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, focus, flatItems, onClose]);

  if (!open) return null;
  let runningIdx = 0;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command, page, action…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocus(0);
            }}
          />
          <span className="cmd-kbd">ESC</span>
        </div>
        <div className="cmd-list">
          {groups.length === 0 ? (
            <div className="px-4 py-6 text-center font-mono text-[12px] text-[color:var(--color-ink-3)]">
              NO MATCHES
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.group}>
                <div className="cmd-group-label">{g.group}</div>
                {g.items.map((it) => {
                  const myIdx = runningIdx++;
                  return (
                    <div
                      key={it.id}
                      className="cmd-row"
                      data-focus={myIdx === focus}
                      onMouseEnter={() => setFocus(myIdx)}
                      onClick={() => window.location.assign(it.href)}
                    >
                      <Icon name={it.glyph} size={14} className="cmd-glyph" />
                      <span>{it.label}</span>
                      {it.meta && <span className="cmd-meta">{it.meta}</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ControllerProps {
  /** initial mounted state (always closed); palette listens for ⌘K to open */
}

export default function CommandPaletteController(_props: ControllerProps = {}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('inventu:open-command-palette', onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('inventu:open-command-palette', onCustom);
    };
  }, []);
  return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}
