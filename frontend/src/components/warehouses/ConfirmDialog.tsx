import { useEffect, type ReactNode } from 'react';

interface Props {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isPending: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pendingLabel,
  confirmVariant = 'primary',
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

  const confirmClass = confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
  const buttonLabel = isPending && pendingLabel ? pendingLabel : confirmLabel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        role="presentation"
        className="absolute inset-0 bg-secondary-950/50 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-[1.25rem] border border-surface-border bg-surface p-6 shadow-card dark:border-secondary-700 dark:bg-secondary-800">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-text-primary"
        >
          {title}
        </h2>
        <div className="mt-2 text-sm text-text-muted">{body}</div>
        {errorMessage && <p className="input-error-msg mt-4">{errorMessage}</p>}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={isPending}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
