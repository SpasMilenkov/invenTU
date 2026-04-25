import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}

export function Panel({ title, action, children, flush, className }: PanelProps) {
  return (
    <div className={`panel${className ? ` ${className}` : ''}`}>
      {title && (
        <div className="panel-head">
          <div className="panel-title">{title}</div>
          {action}
        </div>
      )}
      <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
    </div>
  );
}

export default Panel;
