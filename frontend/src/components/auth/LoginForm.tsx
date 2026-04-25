import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, type LoginFormData } from '../../lib/auth/schemas';
import { login } from '../../lib/auth/api';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import { FormField } from '../ui/FormField';
import QueryProvider from '../providers/QueryProvider';
import { Icon } from '../ui/Icon';

function LoginFormInner() {
  const [registered, setRegistered] = useState(false);
  const { data: existingUser } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') setRegistered(true);
  }, []);

  useEffect(() => {
    if (existingUser) window.location.assign('/dashboard');
  }, [existingUser]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => window.location.assign('/dashboard'),
  });

  const onSubmit = (data: LoginFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {registered && (
        <div
          className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider"
          style={{
            background: 'var(--color-ok-soft)',
            color: 'var(--color-ok)',
            border: '1px solid color-mix(in oklab, var(--color-ok) 30%, transparent)',
          }}
        >
          Account created — please sign in.
        </div>
      )}

      <FormField
        label="Email"
        type="email"
        registration={register('email')}
        error={errors.email}
        placeholder="you@example.com"
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
        {mutation.isPending ? 'Signing in…' : (
          <>
            Sign in <Icon name="arrow" size={14} />
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
        New operator?{' '}
        <a
          href="/register"
          className="font-medium"
          style={{ color: 'var(--color-accent-deep)' }}
        >
          Request access →
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
