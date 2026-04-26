import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import QueryProvider from '../providers/QueryProvider';
import { FormField } from '../ui/FormField';
import { Panel } from '../ui/Panel';
import { PageHeader } from '../ui/PageHeader';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import { createProductSchema, type CreateProductInput } from '../../lib/schemas/products';
import { useCreateProduct } from '../../lib/hooks/useProducts';
import { useWarehousesList } from '../../lib/hooks/useWarehouses';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';
import { useCheckSkuAvailability } from '../../lib/hooks/useCheckSkuAvailability';
import CategoryPicker from '../categories/CategoryPicker';

const CREATE_FIELD_MAP = buildFieldMap<CreateProductInput>([
  'sku',
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

function ProductCreatePageInner() {
  const mutation = useCreateProduct();
  const warehouses = useWarehousesList({ page: 1, pageSize: 200, status: 'Active' });

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: '',
      name: '',
      categoryId: '',
      primaryWarehouseId: '',
      unitPrice: 0,
      costPrice: 0,
      unitOfMeasure: 'each',
      isActive: true,
      description: '',
      barcode: '',
      minStockLevel: 0,
      maxStockLevel: undefined,
      reorderPoint: 0,
    },
  });

  const skuValue = watch('sku') ?? '';
  const debouncedSku = useDebouncedValue(skuValue, 400);
  const skuAvailability = useCheckSkuAvailability(debouncedSku);

  useEffect(() => {
    if (skuAvailability.status === 'taken') {
      setError('sku', { type: 'manual', message: 'SKU already in use' });
    } else if (skuAvailability.status === 'available') {
      if (errors.sku?.type === 'manual') {
        clearErrors('sku');
      }
    }
  }, [skuAvailability.status, setError, clearErrors, errors.sku?.type]);

  async function onSubmit(values: CreateProductInput) {
    const payload: CreateProductInput = {
      ...values,
      sku: values.sku.trim().toUpperCase(),
      primaryWarehouseId: values.primaryWarehouseId === '' ? undefined : values.primaryWarehouseId,
      description: values.description === '' ? undefined : values.description,
      barcode: values.barcode === '' ? undefined : values.barcode,
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success('Product created');
      window.location.assign('/products');
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateProductInput>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) {
        toast.error(extractAuthErrorMessage(err));
      }
    }
  }

  return (
    <>
      <PageHeader
        sub="OPERATE / PRODUCTS"
        title="New product"
        description="Create a product record."
        actions={<a className="btn btn-ghost" href="/products">Cancel</a>}
      />
      <Panel>
        <form
          id="product-create-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
        >
          {/* Identity */}
          <div className="flex flex-col gap-4">
            <div>
              <FormField
                label="SKU"
                mono
                required
                registration={register('sku')}
                error={errors.sku}
                placeholder="ACME-001"
              />
              {skuValue !== '' && skuAvailability.status === 'checking' && (
                <p className="input-help">Checking…</p>
              )}
              {skuValue !== '' && skuAvailability.status === 'available' && !errors.sku && (
                <p className="input-help" style={{ color: 'var(--color-ok)' }}>✓ Available</p>
              )}
            </div>
            <FormField
              label="Name"
              required
              registration={register('name')}
              error={errors.name}
              placeholder="Stainless bolt 50mm"
            />
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Pricing */}
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

          {/* Inventory */}
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

          {/* Identifiers & meta */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Barcode"
              registration={register('barcode')}
              error={errors.barcode}
            />
            <FormField
              label="Unit of measure"
              required
              registration={register('unitOfMeasure')}
              error={errors.unitOfMeasure}
              placeholder="units, kg, liters…"
            />
          </div>

          {/* Description */}
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

          {/* Status */}
          <label className="check">
            <input type="checkbox" {...register('isActive')} />
            <span>Active</span>
          </label>

          {/* Footer */}
          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--color-rule)' }}
          >
            <a href="/products" className="btn btn-ghost">Cancel</a>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending || skuAvailability.status === 'taken'}
            >
              {mutation.isPending ? 'Creating…' : 'Create product'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}

export default function ProductCreatePage() {
  return (
    <QueryProvider>
      <ProductCreatePageInner />
    </QueryProvider>
  );
}
