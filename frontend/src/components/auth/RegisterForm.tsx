import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { registerSchema, type RegisterFormData } from '../../lib/auth/schemas';
import { register as registerUser } from '../../lib/auth/api';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import { FormField } from '../ui/FormField';
import QueryProvider from '../providers/QueryProvider';
import { Icon } from '../ui/Icon';

function RegisterFormInner() {
  const { data: existingUser } = useCurrentUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (existingUser) window.location.assign('/');
  }, [existingUser]);

  const mutation = useMutation<void, Error, RegisterFormData>({
    mutationFn: registerUser,
    onSuccess: () => window.location.assign('/login?registered=1'),
  });

  const onSubmit = (data: RegisterFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <FormField
          label="First name"
          registration={register('firstName')}
          error={errors.firstName}
          placeholder="Mira"
          required
        />
        <FormField
          label="Last name"
          registration={register('lastName')}
          error={errors.lastName}
          placeholder="Koch"
          required
        />
      </div>
      <FormField
        label="Work email"
        type="email"
        registration={register('email')}
        error={errors.email}
        placeholder="you@inventu.io"
        mono
        required
      />
      <FormField
        label="Password"
        type="password"
        registration={register('password')}
        error={errors.password}
        placeholder="••••••••"
        mono
        required
      />
      <FormField
        label="Confirm password"
        type="password"
        registration={register('confirmPassword')}
        error={errors.confirmPassword}
        placeholder="••••••••"
        mono
        required
      />

      {mutation.isError && (
        <p className="input-error-msg text-center">
          {extractAuthErrorMessage(mutation.error)}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ height: 42, justifyContent: 'center' }}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creating account…' : (
          <>
            Submit request <Icon name="arrow" size={14} />
          </>
        )}
      </button>

      <p className="mt-1 text-center text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
        Already have access?{' '}
        <a
          href="/login"
          className="font-medium"
          style={{ color: 'var(--color-accent-deep)' }}
        >
          Sign in →
        </a>
      </p>
    </form>
  );
}

export default function RegisterForm() {
  return (
    <QueryProvider>
      <RegisterFormInner />
    </QueryProvider>
  );
}
