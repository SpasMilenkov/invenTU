import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../ui/FormField';
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

interface DrawerShellProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

function DrawerShell({ title, subtitle, onClose, children }: DrawerShellProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <div
        role="presentation"
        className="absolute inset-0 bg-secondary-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl dark:border-secondary-700 dark:bg-secondary-800">
        <header className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-5 dark:border-secondary-700">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}

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

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-surface-border"
          {...register('isActive')}
        />
        <span>Active</span>
      </label>

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-surface-border pt-4 dark:border-secondary-700">
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

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-surface-border pt-4 dark:border-secondary-700">
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
