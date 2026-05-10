import {
  NEXT_STATUS_LABEL,
  PurchaseOrderStatus,
} from '../../lib/types/purchase-orders';

interface Props {
  status: PurchaseOrderStatus;
  onAdvance: () => void;
  isPending: boolean;
}

export default function StatusTransitionButton({ status, onAdvance, isPending }: Props) {
  const nextLabel = NEXT_STATUS_LABEL[status];
  if (nextLabel === null) {
    return <span style={{ color: 'var(--color-ink-3)' }}>—</span>;
  }
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        onAdvance();
      }}
      disabled={isPending}
    >
      {isPending ? 'Updating…' : nextLabel}
    </button>
  );
}
