import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../ui/FormField';
import { DrawerShell } from '../ui/DrawerShell';
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
import { useWarehousesList } from '../../lib/hooks/useWarehouses';
import type { ProductDto } from '../../lib/types/products';
import CategoryPicker from '../categories/CategoryPicker';

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
  const warehouses = useWarehousesList({ page: 1, pageSize: 200, status: 'All' });

  const {
    register,
    control,
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
    <DrawerShell
      title={`Edit ${product.name}`}
      subtitle="Update pricing, stock thresholds, and availability."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-edit-form"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form
        id="product-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <span className="input-label">SKU</span>
          <p
            className="input mono"
            style={{ background: 'var(--color-bg-sunk)', cursor: 'default' }}
          >
            {product.sku}
          </p>
          <p className="input-help">SKU is fixed once a product is created.</p>
        </div>

        <FormField label="Name" registration={register('name')} error={errors.name} />

        <div>
          <span className="input-label">Category</span>
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <CategoryPicker
                value={field.value || null}
                onChange={(id) => field.onChange(id ?? '')}
                error={fieldState.error}
              />
            )}
          />
        </div>

        <div>
          <label className="input-label" htmlFor="primaryWarehouseId">
            Primary warehouse
          </label>
          <Controller
            control={control}
            name="primaryWarehouseId"
            render={({ field, fieldState }) => (
              <select
                id="primaryWarehouseId"
                className={`select${fieldState.error ? ' input-error' : ''}`}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={warehouses.isLoading}
              >
                <option value="">— None —</option>
                {warehouses.data?.items.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.primaryWarehouseId && (
            <p className="input-error-msg">{errors.primaryWarehouseId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Unit price"
            type="number"
            registration={register('unitPrice', { valueAsNumber: true })}
            error={errors.unitPrice}
          />
          <FormField
            label="Cost price"
            type="number"
            registration={register('costPrice', { valueAsNumber: true })}
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
            registration={register('minStockLevel', { valueAsNumber: true })}
            error={errors.minStockLevel}
          />
          <FormField
            label="Max stock"
            type="number"
            registration={register('maxStockLevel', { valueAsNumber: true })}
            error={errors.maxStockLevel}
          />
          <FormField
            label="Reorder point"
            type="number"
            registration={register('reorderPoint', { valueAsNumber: true })}
            error={errors.reorderPoint}
          />
        </div>

        <FormField label="Barcode" registration={register('barcode')} error={errors.barcode} />

        <div>
          <label className="input-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={`textarea${errors.description ? ' input-error' : ''}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="input-error-msg">{errors.description.message}</p>
          )}
        </div>

        <label className="check">
          <input type="checkbox" {...register('isActive')} />
          <span>Active</span>
        </label>

        {generalError && <p className="input-error-msg">{generalError}</p>}
      </form>
    </DrawerShell>
  );
}
