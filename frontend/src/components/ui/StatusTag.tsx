import { Tag, type TagKind } from './Tag';

interface ActiveStatusProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function ActiveTag({
  active,
  activeLabel = 'ACTIVE',
  inactiveLabel = 'INACTIVE',
}: ActiveStatusProps) {
  return <Tag kind={active ? 'ok' : 'neutral'}>{active ? activeLabel : inactiveLabel}</Tag>;
}

interface StockStatusProps {
  status: 'ok' | 'warn' | 'crit';
}

export function StockTag({ status }: StockStatusProps) {
  const map: Record<StockStatusProps['status'], { kind: TagKind; label: string }> = {
    ok: { kind: 'ok', label: 'IN STOCK' },
    warn: { kind: 'warn', label: 'REORDER' },
    crit: { kind: 'crit', label: 'CRITICAL' },
  };
  const m = map[status];
  return <Tag kind={m.kind}>{m.label}</Tag>;
}
