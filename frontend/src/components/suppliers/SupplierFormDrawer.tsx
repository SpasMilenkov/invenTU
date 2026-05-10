import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FormField } from '../ui/FormField';
import { DrawerShell } from '../ui/DrawerShell';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import {
  normalizeSupplierPayload,
  updateSupplierSchema,
  type UpdateSupplierInput,
} from '../../lib/schemas/suppliers';
import {
  useDeleteSupplier,
  useUpdateSupplier,
} from '../../lib/hooks/useSuppliers';
import type { SupplierDto } from '../../lib/types/suppliers';

const EDIT_FIELD_MAP = buildFieldMap<UpdateSupplierInput>([
  'name',
  'contactEmail',
  'contactPhone',
  'address',
  'isActive',
]);

interface Props {
  supplier: SupplierDto;
  canDelete: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierFormDrawer({ supplier, canDelete, onClose, onSuccess }: Props) {
  const updateMutation = useUpdateSupplier(supplier.id);
  const deleteMutation = useDeleteSupplier();
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateSupplierInput>({
    resolver: zodResolver(updateSupplierSchema),
    defaultValues: {
      name: supplier.name,
      contactEmail: supplier.contactEmail ?? '',
      contactPhone: supplier.contactPhone ?? '',
      address: supplier.address ?? '',
      isActive: supplier.isActive,
    },
  });

  async function onSubmit(values: UpdateSupplierInput) {
    setGeneralError(undefined);
    try {
      await updateMutation.mutateAsync(normalizeSupplierPayload(values));
      toast.success('Supplier updated');
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateSupplierInput>(err, setError, EDIT_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  async function confirmDelete() {
    setDeleteError(undefined);
    try {
      await deleteMutation.mutateAsync(supplier.id);
      toast.success('Supplier deleted');
      setPendingDelete(false);
      onSuccess();
    } catch (err) {
      setDeleteError(extractAuthErrorMessage(err));
    }
  }

  return (
    <DrawerShell
      title={`Edit ${supplier.name}`}
      subtitle="Update the supplier's contact details."
      onClose={onClose}
      footer={
        <>
          {canDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setPendingDelete(true);
                setDeleteError(undefined);
              }}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              style={{ marginRight: 'auto' }}
            >
              Delete permanently
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="supplier-edit-form"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form
        id="supplier-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormField
          label="Name"
          required
          registration={register('name')}
          error={errors.name}
          placeholder="Acme Manufacturing"
        />
        <FormField
          label="Contact email"
          type="email"
          registration={register('contactEmail')}
          error={errors.contactEmail}
          placeholder="orders@acme.com"
        />
        <FormField
          label="Contact phone"
          registration={register('contactPhone')}
          error={errors.contactPhone}
          placeholder="+1 (555) 123-4567"
          hint="Server stores digits only; any common format is accepted."
        />
        <div>
          <label className="input-label" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            className={`textarea${errors.address ? ' input-error' : ''}`}
            {...register('address')}
          />
          {errors.address && <p className="input-error-msg">{errors.address.message}</p>}
        </div>

        <input type="hidden" {...register('isActive')} />

        {generalError && <p className="input-error-msg">{generalError}</p>}
      </form>

      {pendingDelete && (
        <ConfirmModal
          title={`Delete ${supplier.name}?`}
          body="This action cannot be undone. Suppliers with existing purchase orders cannot be deleted."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => {
            if (!deleteMutation.isPending) {
              setPendingDelete(false);
              setDeleteError(undefined);
            }
          }}
        />
      )}
    </DrawerShell>
  );
}
