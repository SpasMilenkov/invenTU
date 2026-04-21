import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SelectField } from '../ui/FormField';
import {
  applyBackendFieldErrors,
  buildFieldMap,
  extractAuthErrorMessage,
} from '../../lib/auth/errors';
import { PASSWORD_HELP_TEXT } from '../../lib/auth/schemas';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import {
  createUserSchema,
  updateUserSchema,
  USER_ROLES,
  DEFAULT_USER_ROLE,
  toUserRole,
  type CreateUserInput,
  type UpdateUserInput,
} from '../../lib/schemas/users';
import {
  useCreateUser,
  useUpdateUser,
  toUpdatePayload,
  type UserSummary,
} from '../../lib/hooks/useUsers';

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

const ROLE_OPTIONS = USER_ROLES.map((r) => ({ value: r, label: r }));

const CREATE_FIELD_MAP = buildFieldMap<CreateUserInput>([
  'firstName',
  'lastName',
  'email',
  'password',
  'role',
]);

// `password` on the backend maps to `newPassword` on the edit form, so alias it explicitly.
const EDIT_FIELD_MAP: Record<string, keyof UpdateUserInput> = {
  ...buildFieldMap<UpdateUserInput>([
    'firstName',
    'lastName',
    'role',
    'currentPassword',
    'newPassword',
  ]),
  password: 'newPassword',
  Password: 'newPassword',
};

interface CreateFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUserForm({ onClose, onSuccess }: CreateFormProps) {
  const mutation = useCreateUser();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: DEFAULT_USER_ROLE },
  });

  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: CreateUserInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync(values);
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<CreateUserInput>(err, setError, CREATE_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First name" registration={register('firstName')} error={errors.firstName} placeholder="Jane" />
        <FormField label="Last name" registration={register('lastName')} error={errors.lastName} placeholder="Doe" />
      </div>
      <FormField label="Email" type="email" registration={register('email')} error={errors.email} placeholder="jane@example.com" />
      <FormField label="Password" type="password" registration={register('password')} error={errors.password} placeholder="••••••••" />
      <p className="input-help -mt-2">{PASSWORD_HELP_TEXT}</p>
      <SelectField label="Role" registration={register('role')} error={errors.role} options={ROLE_OPTIONS} />

      {generalError && <p className="input-error-msg">{generalError}</p>}

      <div className="mt-2 flex items-center justify-end gap-2 border-t border-surface-border pt-4 dark:border-secondary-700">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  user: UserSummary;
  onClose: () => void;
  onSuccess: () => void;
}

function EditUserForm({ user, onClose, onSuccess }: EditFormProps) {
  const { data: me } = useCurrentUser();
  const isSelf = me?.userId === user.id;
  const mutation = useUpdateUser(user.id, { isSelf });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      role: toUserRole(user.roles[0]),
      currentPassword: '',
      newPassword: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  async function onSubmit(values: UpdateUserInput) {
    setGeneralError(undefined);
    try {
      await mutation.mutateAsync(toUpdatePayload(values));
      onSuccess();
    } catch (err) {
      const mapped = applyBackendFieldErrors<UpdateUserInput>(err, setError, EDIT_FIELD_MAP);
      if (!mapped) setGeneralError(extractAuthErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First name" registration={register('firstName')} error={errors.firstName} />
        <FormField label="Last name" registration={register('lastName')} error={errors.lastName} />
      </div>

      <SelectField label="Role" registration={register('role')} error={errors.role} options={ROLE_OPTIONS} />

      <div className="rounded-md border border-surface-border p-4 dark:border-secondary-700">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-medium text-text-primary"
          onClick={() => setShowPassword((v) => !v)}
          aria-expanded={showPassword}
        >
          <span>Change password</span>
          <span aria-hidden className="text-text-muted">{showPassword ? '−' : '+'}</span>
        </button>
        {showPassword && (
          <div className="mt-4 flex flex-col gap-4">
            <FormField
              label="Current password"
              type="password"
              registration={register('currentPassword')}
              error={errors.currentPassword}
            />
            <FormField
              label="New password"
              type="password"
              registration={register('newPassword')}
              error={errors.newPassword}
            />
            <p className="input-help -mt-2">{PASSWORD_HELP_TEXT}</p>
          </div>
        )}
      </div>

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
  user?: UserSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormDrawer({ mode, user, onClose, onSuccess }: Props) {
  if (mode === 'edit' && !user) return null;

  const title = mode === 'create' ? 'New user' : `Edit ${user!.firstName} ${user!.lastName}`;
  const subtitle =
    mode === 'create'
      ? 'Create an account and assign a role.'
      : 'Update name, role, or reset this user’s password.';

  return (
    <DrawerShell title={title} subtitle={subtitle} onClose={onClose}>
      {mode === 'create' ? (
        <CreateUserForm onClose={onClose} onSuccess={onSuccess} />
      ) : (
        <EditUserForm key={user!.id} user={user!} onClose={onClose} onSuccess={onSuccess} />
      )}
    </DrawerShell>
  );
}
