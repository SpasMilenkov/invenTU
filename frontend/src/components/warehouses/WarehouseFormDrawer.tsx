import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../ui/FormField';
import { DrawerShell } from '../ui/DrawerShell';
import WarehouseStatsHeader from './WarehouseStatsHeader';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import type { z } from 'zod';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
} from '../../lib/schemas/warehouses';

type CreateWarehouseFormValues = z.input<typeof createWarehouseSchema>;
type UpdateWarehouseFormValues = z.input<typeof updateWarehouseSchema>;
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  type WarehouseSummary,
} from '../../lib/hooks/useWarehouses';

type Mode = 'create' | 'edit';

const CREATE_FIELD_MAP = buildFieldMap<CreateWarehouseFormValues>([
  'code',
  'name',
  'location',
  'maxStockLevel',
  'isActive',
]);

const EDIT_FIELD_MAP = buildFieldMap<UpdateWarehouseFormValues>([
  'name',
  'location',
  'maxStockLevel',
]);

interface CreateFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateWarehouseForm({ onClose, onSuccess }: CreateFormProps) {
  const mutation = useCreateWarehouse();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: { isActive: true },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: CreateWarehouseFormValues) {
    setGeneralError(undefined);
    const payload: CreateWarehouseInput = {
      ...values,
      isActive: values.isActive ?? true,
      location: values.location === '' ? undefined : values.location,
      maxStockLevel:
        typeof values.maxStockLevel === 'number' && Number.isNaN(values.maxStockLevel)
          ? undefined
          : values.maxStockLevel,
    };
    try {
      await mutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateWarehouseFormValues>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Code" registration={register('code')} error={errors.code} placeholder="WH-01" />
      <FormField label="Name" registration={register('name')} error={errors.name} placeholder="Main warehouse" />
      <FormField label="Location" registration={register('location')} error={errors.location} placeholder="Building A" />
      <FormField
        label="Max stock level"
        type="number"
        registration={register('maxStockLevel', { valueAsNumber: true })}
        error={errors.maxStockLevel}
        placeholder="1000"
      />

      <label className="check">
        <input type="checkbox" {...register('isActive')} />
        <span>Active</span>
      </label>

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div className="mt-2 flex items-center justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create warehouse'}
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  warehouse: WarehouseSummary;
  onClose: () => void;
  onSuccess: () => void;
}

function EditWarehouseForm({ warehouse, onClose, onSuccess }: EditFormProps) {
  const mutation = useUpdateWarehouse(warehouse.id);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateWarehouseFormValues>({
    resolver: zodResolver(updateWarehouseSchema),
    defaultValues: {
      name: warehouse.name,
      location: warehouse.location ?? '',
      maxStockLevel: warehouse.maxStockLevel ?? undefined,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: UpdateWarehouseFormValues) {
    setGeneralError(undefined);
    const payload: UpdateWarehouseInput = {
      ...values,
      location: values.location === '' ? undefined : values.location,
      maxStockLevel:
        typeof values.maxStockLevel === 'number' && Number.isNaN(values.maxStockLevel)
          ? undefined
          : values.maxStockLevel,
    };
    try {
      await mutation.mutateAsync(payload);
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateWarehouseFormValues>(err, setError, EDIT_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <WarehouseStatsHeader warehouse={warehouse} />
      <FormField label="Name" registration={register('name')} error={errors.name} />
      <FormField label="Location" registration={register('location')} error={errors.location} placeholder="Building A" />
      <FormField
        label="Max stock level"
        type="number"
        registration={register('maxStockLevel', { valueAsNumber: true })}
        error={errors.maxStockLevel}
        placeholder="1000"
      />

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div className="mt-2 flex items-center justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

interface Props {
  mode: Mode;
  warehouse?: WarehouseSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WarehouseFormDrawer({ mode, warehouse, onClose, onSuccess }: Props) {
  if (mode === 'edit' && !warehouse) return null;

  const title = mode === 'create' ? 'New warehouse' : `Edit ${warehouse!.code}`;
  const subtitle =
    mode === 'create'
      ? 'Register a new warehouse to start tracking stock locations.'
      : 'Update the warehouse name, location, or capacity.';

  return (
    <DrawerShell title={title} subtitle={subtitle} onClose={onClose}>
      {mode === 'create' ? (
        <CreateWarehouseForm onClose={onClose} onSuccess={onSuccess} />
      ) : (
        <EditWarehouseForm key={warehouse!.id} warehouse={warehouse!} onClose={onClose} onSuccess={onSuccess} />
      )}
    </DrawerShell>
  );
}
