import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { registerSchema, type RegisterFormData } from '../../lib/auth/schemas';
import { register as registerUser } from '../../lib/auth/api';
import { FormField } from '../ui/FormField';
import QueryProvider from '../providers/QueryProvider';
import type { AxiosError } from 'axios';

function RegisterFormInner() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      window.location.assign('/dashboard');
    }
  }, []);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.accessToken);
      window.location.assign('/dashboard');
    },
  });

  const onSubmit = (data: RegisterFormData) => mutation.mutate(data);

  const errorMessage =
    mutation.isError
      ? ((mutation.error as AxiosError<{ message?: string }>)?.response?.data?.message ?? 'Registration failed. Please try again.')
      : null;

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
      {errorMessage && (
        <p className="input-error-msg text-center">{errorMessage}</p>
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
