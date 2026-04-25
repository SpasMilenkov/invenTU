import type { ReactNode } from 'react';

export function KbdHint({ children }: { children: ReactNode }) {
  return <span className="cmd-kbd">{children}</span>;
}

export default KbdHint;
