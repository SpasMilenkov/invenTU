import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  isPending?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: 'primary' | 'danger';
}

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  pendingLabel,
  isPending,
  errorMessage,
  onConfirm,
  onClose,
  variant = 'primary',
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    window.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, isPending]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-overlay" onClick={isPending ? undefined : onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <p className="modal-sub">CONFIRM</p>
            <h2 className="modal-title">{title}</h2>
          </div>
          <div className="modal-body">
            {body}
            {errorMessage && (
              <p className="input-error-msg mt-3" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
          <div className="modal-foot">
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
              className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? pendingLabel ?? `${confirmLabel}…` : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
