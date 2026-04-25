import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../ui/FormField';
import { DrawerShell } from '../ui/DrawerShell';
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

      <div className="mt-2 flex items-center justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
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
