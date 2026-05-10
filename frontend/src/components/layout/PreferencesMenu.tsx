import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import {
  getDensity,
  setDensity,
  getSidebarMode,
  setSidebarMode,
  getTheme,
  setTheme,
  type Density,
  type SidebarMode,
  type ThemeMode,
} from '../../lib/ui/preferences';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <span className="micro" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </span>
      <div className="seg">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="seg-btn"
            data-on={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreferencesMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [density, setDensityState] = useState<Density>('comfortable');
  const [sidebar, setSidebarState] = useState<SidebarMode>('expanded');
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate from current document/localStorage (after mount, browser-only).
  useEffect(() => {
    setThemeState(getTheme());
    setDensityState(getDensity());
    setSidebarState(getSidebarMode());
  }, []);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleTheme(next: ThemeMode) {
    setThemeState(next);
    setTheme(next);
  }
  function handleDensity(next: Density) {
    setDensityState(next);
    setDensity(next);
  }
  function handleSidebar(next: SidebarMode) {
    setSidebarState(next);
    setSidebarMode(next);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="icon-btn"
        aria-label="Preferences"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Preferences"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="sliders" size={15} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Preferences"
          className="absolute right-0 z-50 mt-2 w-72 border bg-[color:var(--color-paper)] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]"
          style={{ borderColor: 'var(--color-rule-strong)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-rule)', background: 'var(--color-bg-elev)' }}
          >
            <span className="panel-title">PREFERENCES</span>
            <span className="cmd-kbd">ESC</span>
          </div>

          <Segmented<ThemeMode>
            label="THEME"
            value={theme}
            onChange={handleTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <div style={{ borderTop: '1px solid var(--color-rule-faint)' }} />
          <Segmented<Density>
            label="DENSITY"
            value={density}
            onChange={handleDensity}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfy' },
            ]}
          />
          <div style={{ borderTop: '1px solid var(--color-rule-faint)' }} />
          <Segmented<SidebarMode>
            label="SIDEBAR"
            value={sidebar}
            onChange={handleSidebar}
            options={[
              { value: 'expanded', label: 'Open' },
              { value: 'collapsed', label: 'Mini' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
