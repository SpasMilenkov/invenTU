import type { UserSummary } from '../../lib/hooks/useUsers';
import { ConfirmModal } from '../ui/ConfirmModal';

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
  return (
    <ConfirmModal
      title={`Deactivate ${user.firstName} ${user.lastName}?`}
      body={
        <p>
          They will lose access immediately. This cannot be reversed from the UI — an administrator
          will need to restore the account directly in the database if it needs to come back.
        </p>
      }
      confirmLabel="Deactivate"
      pendingLabel="Deactivating…"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
      variant="danger"
    />
  );
}
