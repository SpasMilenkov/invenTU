import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface DrawerShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional footer rendered as `.drawer-foot` (e.g. cancel/save buttons). */
  footer?: ReactNode;
}

export function DrawerShell({ title, subtitle, onClose, children, footer }: DrawerShellProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-backdrop" onClick={onClose} role="presentation" />
      <aside className="drawer">
        <header className="drawer-head">
          <div>
            <h2 className="drawer-title">{title}</h2>
            {subtitle && <p className="drawer-sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="x" size={14} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </div>
  );
}

export default DrawerShell;
