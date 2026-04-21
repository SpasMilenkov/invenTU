import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { FormField } from '../ui/FormField';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import {
  normalizeUpdatePayload,
  updateProductSchema,
  type UpdateProductInput,
} from '../../lib/schemas/products';
import { useUpdateProduct } from '../../lib/hooks/useProducts';
import type { ProductDto } from '../../lib/types/products';

interface WarehouseOption {
  id: string;
  name: string;
}

function useWarehouses() {
  return useQuery<WarehouseOption[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get<WarehouseOption[]>('/warehouses');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const EDIT_FIELD_MAP = buildFieldMap<UpdateProductInput>([
  'name',
  'categoryId',
  'primaryWarehouseId',
  'unitPrice',
  'costPrice',
  'unitOfMeasure',
  'isActive',
  'description',
  'barcode',
  'minStockLevel',
  'maxStockLevel',
  'reorderPoint',
]);

interface Props {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductFormDrawer({ product, onClose, onSuccess }: Props) {
  const mutation = useUpdateProduct(product.id);
  const warehouses = useWarehouses();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      categoryId: product.categoryId,
      primaryWarehouseId: product.primaryWarehouseId ?? undefined,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      unitOfMeasure: product.unitOfMeasure,
      isActive: product.isActive,
      description: product.description ?? undefined,
      barcode: product.barcode ?? undefined,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel ?? undefined,
      reorderPoint: product.reorderPoint,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

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

  async function onSubmit(values: UpdateProductInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync(normalizeUpdatePayload(values));
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateProductInput>(err, setError, EDIT_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Edit ${product.name}`}>
      <div
        role="presentation"
        className="absolute inset-0 bg-secondary-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl dark:border-secondary-700 dark:bg-secondary-800">
        <header className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-5 dark:border-secondary-700">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Edit {product.name}</h2>
            <p className="mt-1 text-sm text-text-muted">
              Update pricing, stock thresholds, and availability.
            </p>
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <span className="input-label">SKU</span>
              <p className="input flex items-center bg-secondary-50 font-mono text-xs dark:bg-secondary-900">
                {product.sku}
              </p>
              <p className="input-help">SKU is fixed once a product is created.</p>
            </div>

            <FormField label="Name" registration={register('name')} error={errors.name} />

            <div>
              <span className="input-label">Category</span>
              <p className="input flex items-center bg-secondary-50 dark:bg-secondary-900">
                {product.categoryName}
              </p>
              <p className="input-help">
                Category cannot be changed from the UI yet — coming once the categories endpoint is available.
              </p>
              <input type="hidden" {...register('categoryId')} />
            </div>

            <div>
              <label className="input-label" htmlFor="primaryWarehouseId">
                Primary warehouse
              </label>
              <select
                id="primaryWarehouseId"
                className={`select${errors.primaryWarehouseId ? ' input-error' : ''}`}
                {...register('primaryWarehouseId')}
                disabled={warehouses.isLoading}
              >
                <option value="">— None —</option>
                {warehouses.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.primaryWarehouseId && (
                <p className="input-error-msg">{errors.primaryWarehouseId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Unit price"
                type="number"
                registration={register('unitPrice')}
                error={errors.unitPrice}
              />
              <FormField
                label="Cost price"
                type="number"
                registration={register('costPrice')}
                error={errors.costPrice}
              />
            </div>

            <FormField
              label="Unit of measure"
              registration={register('unitOfMeasure')}
              error={errors.unitOfMeasure}
              placeholder="units, kg, liters…"
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Min stock"
                type="number"
                registration={register('minStockLevel')}
                error={errors.minStockLevel}
              />
              <FormField
                label="Max stock"
                type="number"
                registration={register('maxStockLevel')}
                error={errors.maxStockLevel}
              />
              <FormField
                label="Reorder point"
                type="number"
                registration={register('reorderPoint')}
                error={errors.reorderPoint}
              />
            </div>

            <FormField
              label="Barcode"
              registration={register('barcode')}
              error={errors.barcode}
            />

            <div>
              <label className="input-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                className={`input min-h-[4.5rem]${errors.description ? ' input-error' : ''}`}
                {...register('description')}
              />
              {errors.description && (
                <p className="input-error-msg">{errors.description.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-surface-border-strong" />
              Active
            </label>

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
        </div>
      </aside>
    </div>
  );
}
