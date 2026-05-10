import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import QueryProvider from '../providers/QueryProvider';
import { FormField } from '../ui/FormField';
import { Panel } from '../ui/Panel';
import { PageHeader } from '../ui/PageHeader';
import { Icon } from '../ui/Icon';
import { useSuppliersList } from '../../lib/hooks/useSuppliers';
import { useProductsList } from '../../lib/hooks/useProducts';
import { useCreatePurchaseOrder } from '../../lib/hooks/usePurchaseOrders';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from '../../lib/schemas/purchase-orders';

const CREATE_FIELD_MAP = buildFieldMap<CreatePurchaseOrderInput>([
  'supplierId',
  'orderDate',
  'expectedDate',
  'purchaseOrderLines',
]);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function PurchaseOrderCreatePageInner() {
  const suppliers = useSuppliersList({});
  const products = useProductsList({ page: 1, pageSize: 200, archive: 'Active' });
  const { data: me } = useCurrentUser();
  const mutation = useCreatePurchaseOrder();
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreatePurchaseOrderInput>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      orderDate: todayIso(),
      expectedDate: '',
      purchaseOrderLines: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'purchaseOrderLines',
  });

  async function onSubmit(values: CreatePurchaseOrderInput) {
    if (!me?.userId) {
      setGeneralError('Cannot determine the current user. Please sign in again.');
      return;
    }
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync({ ...values, createdByUserId: me.userId });
      toast.success('Purchase order created');
      window.location.assign('/purchase-orders');
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreatePurchaseOrderInput>(
        err,
        setError,
        CREATE_FIELD_MAP,
      );
      if (!mapped) {
        setGeneralError(extractAuthErrorMessage(err));
        toast.error(extractAuthErrorMessage(err));
      }
    }
  }

  return (
    <>
      <PageHeader
        sub="PROCURE / PURCHASE ORDERS"
        title="New purchase order"
        description="Create a draft purchase order. You can advance it through its lifecycle from the list."
        actions={<a className="btn btn-ghost" href="/purchase-orders">Cancel</a>}
      />

      <Panel>
        <form
          id="po-create-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="input-label">Supplier *</span>
              <select
                className={`select${errors.supplierId ? ' input-error' : ''}`}
                disabled={suppliers.isLoading}
                {...register('supplierId')}
              >
                <option value="">— Select supplier —</option>
                {suppliers.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="input-error-msg">{errors.supplierId.message}</p>
              )}
            </div>

            <FormField
              label="Order date"
              required
              type="date"
              registration={register('orderDate')}
              error={errors.orderDate}
            />

            <FormField
              label="Expected date"
              type="date"
              registration={register('expectedDate')}
              error={errors.expectedDate}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="input-label">Line items</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
              >
                <Icon name="plus" size={12} /> Add line
              </button>
            </div>

            <div className="panel" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num" style={{ width: 120 }}>Quantity</th>
                    <th className="num" style={{ width: 140 }}>Unit price</th>
                    <th aria-label="Remove" style={{ width: 56 }} />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((line, index) => {
                    const lineErrors = errors.purchaseOrderLines?.[index];
                    return (
                      <tr key={line.id}>
                        <td>
                          <select
                            className={`select${lineErrors?.productId ? ' input-error' : ''}`}
                            defaultValue={line.productId}
                            disabled={products.isLoading}
                            {...register(`purchaseOrderLines.${index}.productId`, {
                              onChange: (e) => {
                                const product = products.data?.items.find(
                                  (p) => p.id === e.target.value,
                                );
                                if (product) {
                                  setValue(
                                    `purchaseOrderLines.${index}.unitPrice`,
                                    product.unitPrice,
                                    { shouldValidate: true },
                                  );
                                }
                              },
                            })}
                          >
                            <option value="">— Select product —</option>
                            {products.data?.items.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku} — {p.name}
                              </option>
                            ))}
                          </select>
                          {lineErrors?.productId && (
                            <p className="input-error-msg">{lineErrors.productId.message}</p>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className={`input${lineErrors?.quantity ? ' input-error' : ''}`}
                            {...register(`purchaseOrderLines.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                          {lineErrors?.quantity && (
                            <p className="input-error-msg">{lineErrors.quantity.message}</p>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className={`input${lineErrors?.unitPrice ? ' input-error' : ''}`}
                            {...register(`purchaseOrderLines.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                          />
                          {lineErrors?.unitPrice && (
                            <p className="input-error-msg">{lineErrors.unitPrice.message}</p>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            aria-label="Remove line"
                            className="icon-btn"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.purchaseOrderLines &&
              typeof errors.purchaseOrderLines.message === 'string' && (
                <p className="input-error-msg mt-2">{errors.purchaseOrderLines.message}</p>
              )}
          </div>

          {generalError && <p className="input-error-msg">{generalError}</p>}

          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--color-rule)' }}
          >
            <a href="/purchase-orders" className="btn btn-ghost">Cancel</a>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Create purchase order'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}

export default function PurchaseOrderCreatePage() {
  return (
    <QueryProvider>
      <PurchaseOrderCreatePageInner />
    </QueryProvider>
  );
}
