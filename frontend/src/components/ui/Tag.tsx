import type { ReactNode } from 'react';

export type TagKind = 'ok' | 'warn' | 'crit' | 'info' | 'neutral' | 'accent';

interface TagProps {
  kind?: TagKind;
  children: ReactNode;
  className?: string;
}

export function Tag({ kind = 'neutral', children, className }: TagProps) {
  const cls = `tag tag-${kind}${className ? ` ${className}` : ''}`;
  return <span className={cls}>{children}</span>;
}

export default Tag;
