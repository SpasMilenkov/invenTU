import type { ReactNode } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

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

export default function ConfirmDialog(props: Props) {
  return (
    <ConfirmModal
      title={props.title}
      body={props.body}
      confirmLabel={props.confirmLabel}
      pendingLabel={props.pendingLabel}
      isPending={props.isPending}
      errorMessage={props.errorMessage}
      onConfirm={props.onConfirm}
      onClose={props.onClose}
      variant={props.confirmVariant ?? 'primary'}
    />
  );
}
