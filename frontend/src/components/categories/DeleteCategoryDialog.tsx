import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';
import { useDeleteCategory } from '../../lib/hooks/useCategories';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import type { CategoryDto } from '../../lib/schemas/categories';

interface Props {
  category: CategoryDto;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCategoryDialog({ category, onClose, onSuccess }: Props) {
  const mutation = useDeleteCategory();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const childCount = category.subCategories.length;

  const body = (
    <div>
      <p>{`Are you sure you want to delete "${category.name}"?`}</p>
      {childCount > 0 && (
        <p className="mt-2">
          {`This category has ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} and cannot be deleted while they exist.`}
        </p>
      )}
    </div>
  );

  async function handleConfirm() {
    setErrorMessage(undefined);
    try {
      await mutation.mutateAsync({ id: category.id });
      toast.success('Category deleted');
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErrorMessage(
          "Can't delete this category — it has products or subcategories. Move or remove them first.",
        );
      } else {
        setErrorMessage(extractAuthErrorMessage(err));
      }
    }
  }

  return (
    <ConfirmModal
      title="Delete category"
      body={body}
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      variant="danger"
      isPending={mutation.isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}
