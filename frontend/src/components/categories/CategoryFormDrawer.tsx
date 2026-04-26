import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FormField } from '../ui/FormField';
import { DrawerShell } from '../ui/DrawerShell';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import {
  createCategorySchema,
  updateCategorySchema,
  type CategoryDto,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../../lib/schemas/categories';
import { useCreateCategory, useUpdateCategory } from '../../lib/hooks/useCategories';
import CategoryPicker from './CategoryPicker';

type Mode = 'create' | 'edit';

const CREATE_FIELD_MAP = buildFieldMap<CreateCategoryInput>([
  'name',
  'description',
  'parentCategoryId',
]);

const UPDATE_FIELD_MAP = buildFieldMap<UpdateCategoryInput>([
  'name',
  'description',
  'parentCategoryId',
]);

function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

interface CreateFormProps {
  defaultParentId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateCategoryForm({ defaultParentId, onClose, onSuccess }: CreateFormProps) {
  const mutation = useCreateCategory();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      parentCategoryId: defaultParentId ?? null,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  const nameRegistration = register('name');
  const composedNameRef = useCallback(
    (el: HTMLInputElement | null) => {
      nameRegistration.ref(el);
      if (el) el.focus();
    },
    [nameRegistration.ref],
  );

  async function onSubmit(values: CreateCategoryInput) {
    setGeneralError(undefined);
    // The form uses '' for "no description"; the backend expects null or a string.
    const payload: CreateCategoryInput = {
      name: values.name,
      description: normalizeDescription(values.description),
      parentCategoryId: values.parentCategoryId ?? null,
    };
    try {
      await mutation.mutateAsync(payload);
      toast.success('Category created');
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateCategoryInput>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField
        label="Name"
        required
        registration={{ ...nameRegistration, ref: composedNameRef }}
        error={errors.name}
        placeholder="e.g. Electronics"
      />

      <FormField
        label="Description"
        registration={register('description')}
        error={errors.description}
        placeholder="Optional"
      />

      <div className="field">
        <div className="form-field-label">
          <span>Parent (optional)</span>
        </div>
        <Controller
          control={control}
          name="parentCategoryId"
          render={({ field, fieldState }) => (
            <CategoryPicker
              value={field.value ?? null}
              onChange={(id) => field.onChange(id)}
              error={fieldState.error}
              clearable
            />
          )}
        />
      </div>

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div
        className="mt-2 flex items-center justify-end gap-2 pt-4"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create category'}
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  category: CategoryDto;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCategoryForm({ category, onClose, onSuccess }: EditFormProps) {
  const mutation = useUpdateCategory();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description ?? '',
      parentCategoryId: category.parentCategoryId,
    },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  const nameRegistration = register('name');
  const composedNameRef = useCallback(
    (el: HTMLInputElement | null) => {
      nameRegistration.ref(el);
      if (el) el.focus();
    },
    [nameRegistration.ref],
  );

  async function onSubmit(values: UpdateCategoryInput) {
    setGeneralError(undefined);
    // Parent picker is hidden in edit mode; preserve the existing parent
    // structurally so the backend doesn't reparent to root.
    const payload: UpdateCategoryInput = {
      name: values.name,
      description: normalizeDescription(values.description),
      parentCategoryId: category.parentCategoryId,
    };
    try {
      await mutation.mutateAsync({ id: category.id, payload });
      toast.success('Category updated');
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateCategoryInput>(err, setError, UPDATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField
        label="Name"
        required
        registration={{ ...nameRegistration, ref: composedNameRef }}
        error={errors.name}
        placeholder="e.g. Electronics"
      />

      <FormField
        label="Description"
        registration={register('description')}
        error={errors.description}
        placeholder="Optional"
      />

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div
        className="mt-2 flex items-center justify-end gap-2 pt-4"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={mutation.isPending}
        >
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
  defaultParentId?: string | null;
  category?: CategoryDto;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryFormDrawer({
  mode,
  defaultParentId,
  category,
  onClose,
  onSuccess,
}: Props) {
  if (mode === 'edit' && !category) return null;

  const title = mode === 'create' ? 'New category' : `Edit ${category!.name}`;
  const subtitle =
    mode === 'create' ? 'Add a category to the hierarchy.' : 'Update this category.';

  return (
    <DrawerShell title={title} subtitle={subtitle} onClose={onClose}>
      {mode === 'create' ? (
        <CreateCategoryForm
          defaultParentId={defaultParentId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      ) : (
        <EditCategoryForm
          key={category!.id}
          category={category!}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </DrawerShell>
  );
}
