import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  sub?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, sub, description, actions }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        {sub && <div className="page-sub">{sub}</div>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <div className="mt-1 text-[12.5px] text-[color:var(--color-ink-3)]">{description}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
