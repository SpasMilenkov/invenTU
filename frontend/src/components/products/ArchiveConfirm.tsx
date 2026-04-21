import { useEffect } from 'react';
import type { ProductDto } from '../../lib/types/products';

interface Props {
  product: ProductDto;
  isPending: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ArchiveConfirm({
  product,
  isPending,
  errorMessage,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-title"
    >
      <div
        role="presentation"
        className="absolute inset-0 bg-secondary-950/50 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-[1.25rem] border border-surface-border bg-surface p-6 shadow-card dark:border-secondary-700 dark:bg-secondary-800">
        <h2 id="archive-title" className="text-lg font-semibold text-text-primary">
          Archive {product.name}?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          The product will be hidden from most views. Archiving is blocked if any stock is still on hand —
          issue or transfer stock first.
        </p>
        {errorMessage && <p className="input-error-msg mt-4">{errorMessage}</p>}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Archiving…' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
