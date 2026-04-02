import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, type LoginFormData } from '../../lib/auth/schemas';
import { login } from '../../lib/auth/api';
import { FormField } from '../ui/FormField';
import QueryProvider from '../providers/QueryProvider';

function LoginFormInner() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      window.location.assign('/dashboard');
    }
  }, []);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.accessToken);
      window.location.assign('/dashboard');
    },
  });

  const onSubmit = (data: LoginFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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

      {mutation.isError && (
        <p className="input-error-msg text-center">Invalid email or password.</p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-2"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-primary-600 hover:underline dark:text-primary-400">
          Register
        </a>
      </p>
    </form>
  );
}

export default function LoginForm() {
  return (
    <QueryProvider>
      <LoginFormInner />
    </QueryProvider>
  );
}
