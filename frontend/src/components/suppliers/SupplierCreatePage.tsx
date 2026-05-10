import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  createSupplierSchema,
  normalizeSupplierPayload,
  type CreateSupplierInput,
} from '../../lib/schemas/suppliers';
import { useCreateSupplier } from '../../lib/hooks/useSuppliers';

const CREATE_FIELD_MAP = buildFieldMap<CreateSupplierInput>([
  'name',
  'contactEmail',
  'contactPhone',
  'address',
  'isActive',
]);

function SupplierCreatePageInner() {
  const mutation = useCreateSupplier();
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      isActive: true,
    },
  });

  async function onSubmit(values: CreateSupplierInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync(normalizeSupplierPayload(values));
      toast.success('Supplier created');
      window.location.assign('/suppliers');
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateSupplierInput>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) {
        setGeneralError(extractAuthErrorMessage(err));
        toast.error(extractAuthErrorMessage(err));
      }
    }
  }

  return (
    <>
      <PageHeader
        sub="PROCURE / SUPPLIERS"
        title="New supplier"
        description="Create a supplier record."
        actions={<a className="btn btn-ghost" href="/suppliers">Cancel</a>}
      />
      <Panel>
        <form
          id="supplier-create-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
        >
          <FormField
            label="Name"
            required
            registration={register('name')}
            error={errors.name}
            placeholder="Acme Manufacturing"
          />
          <div className="grid grid-cols-2 gap-4">
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
              hint="Server stores digits only."
            />
          </div>
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

          <div
            style={{
              padding: '16px',
              borderRadius: '6px',
              background: 'var(--color-bg-elev)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <div className="input-label" style={{ marginBottom: 8 }}>Status</div>
            <label className="check">
              <input type="checkbox" {...register('isActive')} />
              <span style={{ fontWeight: 600 }}>Active supplier</span>
            </label>
            <p className="input-help" style={{ marginTop: 8 }}>
              Inactive suppliers are hidden from the default supplier list and cannot be assigned to new purchase orders.
            </p>
          </div>

          {generalError && <p className="input-error-msg">{generalError}</p>}

          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--color-rule)' }}
          >
            <a href="/suppliers" className="btn btn-ghost">Cancel</a>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Create supplier'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}

export default function SupplierCreatePage() {
  return (
    <QueryProvider>
      <SupplierCreatePageInner />
    </QueryProvider>
  );
}
