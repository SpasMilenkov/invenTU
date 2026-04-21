import { useEffect } from 'react';
import type { UserSummary } from '../../lib/hooks/useUsers';

interface Props {
  user: UserSummary;
  isPending: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeactivateConfirm({
  user,
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
      aria-labelledby="deactivate-title"
    >
      <div
        role="presentation"
        className="absolute inset-0 bg-secondary-950/50 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-[1.25rem] border border-surface-border bg-surface p-6 shadow-card dark:border-secondary-700 dark:bg-secondary-800">
        <h2 id="deactivate-title" className="text-lg font-semibold text-text-primary">
          Deactivate {user.firstName} {user.lastName}?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          They will lose access immediately. This cannot be reversed from the UI — an administrator
          will need to restore the account directly in the database if it needs to come back.
        </p>
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
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
