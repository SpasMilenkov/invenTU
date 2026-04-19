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
    if (existingUser) {
      window.location.assign('/dashboard');
    }
  }, [existingUser]);

  const mutation = useMutation<void, Error, RegisterFormData>({
    mutationFn: registerUser,
    onSuccess: () => {
      window.location.assign('/login?registered=1');
    },
  });

  const onSubmit = (data: RegisterFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="First name"
          registration={register('firstName')}
          error={errors.firstName}
          placeholder="Jane"
        />
        <FormField
          label="Last name"
          registration={register('lastName')}
          error={errors.lastName}
          placeholder="Doe"
        />
      </div>
      <FormField
        label="Email"
        type="email"
        registration={register('email')}
        error={errors.email}
        placeholder="you@example.com"
      />
      <FormField
        label="Password"
        type="password"
        registration={register('password')}
        error={errors.password}
        placeholder="••••••••"
      />
      <FormField
        label="Confirm password"
        type="password"
        registration={register('confirmPassword')}
        error={errors.confirmPassword}
        placeholder="••••••••"
      />

      {mutation.isError && (
        <p className="input-error-msg text-center">
          {extractAuthErrorMessage(mutation.error)}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-2"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <a href="/login" className="text-primary-600 hover:underline dark:text-primary-400">
          Sign in
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
