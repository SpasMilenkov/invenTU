import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../ui/FormField';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import {
  createStockLocationSchema,
  updateStockLocationSchema,
  type CreateStockLocationInput,
  type UpdateStockLocationInput,
} from '../../lib/schemas/stockLocations';
import {
  useCreateLocation,
  useUpdateLocation,
  type StockLocationSummary,
} from '../../lib/hooks/useStockLocations';

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

const CREATE_FIELD_MAP = buildFieldMap<CreateStockLocationInput>([
  'zone',
  'aisle',
  'shelf',
  'bin',
  'maxCapacity',
]);

const UPDATE_FIELD_MAP = buildFieldMap<UpdateStockLocationInput>([
  'zone',
  'aisle',
  'shelf',
  'bin',
  'maxCapacity',
]);

function normalizePayload<T extends { aisle?: string; shelf?: string; bin?: string }>(values: T): T {
  return {
    ...values,
    aisle: values.aisle === '' ? undefined : values.aisle,
    shelf: values.shelf === '' ? undefined : values.shelf,
    bin: values.bin === '' ? undefined : values.bin,
  };
}

interface CreateFormProps {
  warehouseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateLocationForm({ warehouseId, onClose, onSuccess }: CreateFormProps) {
  const mutation = useCreateLocation(warehouseId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateStockLocationInput>({
    resolver: zodResolver(createStockLocationSchema),
    defaultValues: {
      zone: '',
      aisle: '',
      shelf: '',
      bin: '',
      maxCapacity: undefined as unknown as number,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: CreateStockLocationInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync(normalizePayload(values));
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateStockLocationInput>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Zone" registration={register('zone')} error={errors.zone} placeholder="A" />
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Aisle" registration={register('aisle')} error={errors.aisle} placeholder="01" />
        <FormField label="Shelf" registration={register('shelf')} error={errors.shelf} placeholder="S1" />
        <FormField label="Bin" registration={register('bin')} error={errors.bin} placeholder="B1" />
      </div>
      <FormField
        label="Max capacity"
        type="number"
        registration={register('maxCapacity', { valueAsNumber: true })}
        error={errors.maxCapacity}
        placeholder="100"
      />

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-surface-border pt-4 dark:border-secondary-700">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create location'}
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  warehouseId: string;
  location: StockLocationSummary;
  onClose: () => void;
  onSuccess: () => void;
}

function EditLocationForm({ warehouseId, location, onClose, onSuccess }: EditFormProps) {
  const mutation = useUpdateLocation(warehouseId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateStockLocationInput>({
    resolver: zodResolver(updateStockLocationSchema),
    defaultValues: {
      zone: location.zone,
      aisle: location.aisle ?? '',
      shelf: location.shelf ?? '',
      bin: location.bin ?? '',
      maxCapacity: location.maxCapacity,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: UpdateStockLocationInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync({ id: location.id, payload: normalizePayload(values) });
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateStockLocationInput>(err, setError, UPDATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Zone" registration={register('zone')} error={errors.zone} placeholder="A" />
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Aisle" registration={register('aisle')} error={errors.aisle} placeholder="01" />
        <FormField label="Shelf" registration={register('shelf')} error={errors.shelf} placeholder="S1" />
        <FormField label="Bin" registration={register('bin')} error={errors.bin} placeholder="B1" />
      </div>
      <FormField
        label="Max capacity"
        type="number"
        registration={register('maxCapacity', { valueAsNumber: true })}
        error={errors.maxCapacity}
        placeholder="100"
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
  warehouseId: string;
  warehouseLabel: string;
  mode: Mode;
  location?: StockLocationSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LocationFormDrawer({
  warehouseId,
  warehouseLabel,
  mode,
  location,
  onClose,
  onSuccess,
}: Props) {
  if (mode === 'edit' && !location) return null;

  const title = mode === 'create' ? 'New location' : `Edit ${location!.fullLocationCode}`;
  const subtitle =
    mode === 'create'
      ? `Add a storage location to ${warehouseLabel}.`
      : `Update this location in ${warehouseLabel}.`;

  return (
    <DrawerShell title={title} subtitle={subtitle} onClose={onClose}>
      {mode === 'create' ? (
        <CreateLocationForm warehouseId={warehouseId} onClose={onClose} onSuccess={onSuccess} />
      ) : (
        <EditLocationForm
          key={location!.id}
          warehouseId={warehouseId}
          location={location!}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </DrawerShell>
  );
}
