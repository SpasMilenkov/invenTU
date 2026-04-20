import { useEffect, useState } from 'react';
import { useProfile, useUpdateProfile, useChangePassword } from '../../lib/hooks/useProfile';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileValues,
  type ChangePasswordValues,
} from '../../lib/schemas/profile';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface IdentityErrorLike {
  code?: string;
  description?: string;
}

function extractServerErrors(err: unknown, fallback: string): string[] {
  const axiosError = err as { response?: { status?: number; data?: unknown } };
  const status = axiosError?.response?.status;
  if (status === 403) return ['You are not allowed to perform this action.'];

  const data = axiosError?.response?.data;
  if (Array.isArray(data)) {
    const messages = (data as IdentityErrorLike[])
      .map((e) => e?.description)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (messages.length > 0) return messages;
  }
  if (typeof data === 'string' && data.length > 0) return [data];
  return [fallback];
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || 'U';
}

function roleBadgeClasses(role: string): string {
  switch (role) {
    case 'Admin':
      return 'bg-accent-100 text-accent-800 ring-1 ring-accent-300/60 dark:bg-accent-900/40 dark:text-accent-200 dark:ring-accent-600/40';
    case 'Manager':
      return 'bg-primary-100 text-primary-800 ring-1 ring-primary-300/60 dark:bg-primary-900/40 dark:text-primary-200 dark:ring-primary-600/40';
    case 'Worker':
      return 'bg-secondary-100 text-secondary-800 ring-1 ring-secondary-300/60 dark:bg-secondary-700/60 dark:text-secondary-200 dark:ring-secondary-500/40';
    default:
      return 'bg-secondary-100 text-secondary-700 ring-1 ring-secondary-300/60 dark:bg-secondary-800 dark:text-secondary-300 dark:ring-secondary-600/40';
  }
}

// ---------------------------------------------------------------------------
// Section shell — two-column (description left, control right) on desktop
// ---------------------------------------------------------------------------

function Section({
  eyebrow,
  title,
  description,
  tone = 'neutral',
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  tone?: 'neutral' | 'security';
  children: React.ReactNode;
}) {
  const rail =
    tone === 'security'
      ? 'before:bg-warning-400/70 dark:before:bg-warning-500/60'
      : 'before:bg-transparent';

  return (
    <section
      className={`relative grid grid-cols-1 gap-6 px-6 py-8 md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)] md:gap-10 before:absolute before:left-0 before:top-6 before:bottom-6 before:w-[3px] before:rounded-full before:content-[''] ${rail}`}
    >
      <div className="md:pr-2">
        {eyebrow && (
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {eyebrow}
          </p>
        )}
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Identity Hero
// ---------------------------------------------------------------------------

function IdentityHero() {
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface p-8 shadow-card dark:border-secondary-700 dark:bg-secondary-800">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 animate-pulse rounded-2xl bg-surface-alt" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-64 animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[1.25rem] border border-danger-200 bg-danger-50 p-8 text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
        Could not load your profile. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800">
      {/* Decorative gradient wash — subtle, bounded by the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
        style={{
          background:
            'radial-gradient(80% 120% at 100% 0%, var(--color-accent-400) 0%, transparent 55%), radial-gradient(70% 100% at 0% 100%, var(--color-primary-500) 0%, transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent dark:via-primary-300/30"
      />

      <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl opacity-40 blur-md"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
              }}
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-semibold tracking-wide text-white"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                boxShadow:
                  '0 10px 30px -12px rgb(76 110 245 / 0.55), inset 0 1px 0 0 rgb(255 255 255 / 0.18)',
              }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Account
            </p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight text-text-primary">
              {data.firstName} {data.lastName}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{data.email}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Access level
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide ${roleBadgeClasses(
              data.role || 'Unknown',
            )}`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
            />
            {data.role || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Update Name Form
// ---------------------------------------------------------------------------

function UpdateNameForm() {
  const { data } = useProfile();
  const mutation = useUpdateProfile(data?.userId);

  const [values, setValues] = useState<UpdateProfileValues>({ firstName: '', lastName: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProfileValues, string>>>({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const firstName = data?.firstName;
  const lastName = data?.lastName;
  useEffect(() => {
    if (firstName !== undefined && lastName !== undefined) {
      setValues({ firstName, lastName });
    }
  }, [firstName, lastName]);

  function handleChange(field: keyof UpdateProfileValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const result = updateProfileSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdateProfileValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UpdateProfileValues;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await mutation.mutateAsync(result.data);
      setSuccess(true);
    } catch (err) {
      setServerError(extractServerErrors(err, 'Failed to update name. Please try again.')[0]);
    }
  }

  const disabled = mutation.isPending || !data?.userId;
  const dirty =
    data && (values.firstName !== data.firstName || values.lastName !== data.lastName);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            className={`input${errors.firstName ? ' input-error' : ''}`}
            value={values.firstName}
            onChange={(e) => handleChange('firstName', e.currentTarget.value)}
            disabled={disabled}
            autoComplete="given-name"
          />
          {errors.firstName && <p className="input-error-msg">{errors.firstName}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            className={`input${errors.lastName ? ' input-error' : ''}`}
            value={values.lastName}
            onChange={(e) => handleChange('lastName', e.currentTarget.value)}
            disabled={disabled}
            autoComplete="family-name"
          />
          {errors.lastName && <p className="input-error-msg">{errors.lastName}</p>}
        </div>
      </div>

      {serverError && <p className="input-error-msg">{serverError}</p>}

      <div className="flex items-center justify-between gap-4 border-t border-surface-border pt-4 dark:border-secondary-700">
        <div className="min-h-[1.25rem] text-xs">
          {success ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success-600 dark:text-success-400">
              <svg
                aria-hidden
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          ) : dirty ? (
            <span className="text-text-muted">Unsaved changes</span>
          ) : (
            <span className="text-text-muted">Your display name across invenTU.</span>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled || !dirty}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Change Password Form
// ---------------------------------------------------------------------------

const EMPTY_PASSWORD_FORM: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function ChangePasswordForm() {
  const { data } = useProfile();
  const mutation = useChangePassword(data?.userId);

  const [values, setValues] = useState<ChangePasswordValues>(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordValues, string>>>({});
  const [success, setSuccess] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  function handleChange(field: keyof ChangePasswordValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccess(false);
    setServerErrors([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerErrors([]);

    const result = changePasswordSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ChangePasswordValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ChangePasswordValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await mutation.mutateAsync({
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
      });
      setValues(EMPTY_PASSWORD_FORM);
      setSuccess(true);
    } catch (err) {
      setServerErrors(extractServerErrors(err, 'Failed to change password. Please try again.'));
    }
  }

  // Tiny strength meter on the new password field — gestural, not a validator
  const strength = scorePassword(values.newPassword);
  const disabled = mutation.isPending || !data?.userId;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <label className="input-label" htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          className={`input${errors.currentPassword ? ' input-error' : ''}`}
          value={values.currentPassword}
          onChange={(e) => handleChange('currentPassword', e.currentTarget.value)}
          disabled={disabled}
          autoComplete="current-password"
        />
        {errors.currentPassword && <p className="input-error-msg">{errors.currentPassword}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="input-label" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            className={`input${errors.newPassword ? ' input-error' : ''}`}
            value={values.newPassword}
            onChange={(e) => handleChange('newPassword', e.currentTarget.value)}
            disabled={disabled}
            autoComplete="new-password"
          />
          {errors.newPassword ? (
            <p className="input-error-msg">{errors.newPassword}</p>
          ) : (
            <StrengthMeter strength={strength} />
          )}
        </div>
        <div>
          <label className="input-label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`input${errors.confirmPassword ? ' input-error' : ''}`}
            value={values.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.currentTarget.value)}
            disabled={disabled}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="input-error-msg">{errors.confirmPassword}</p>}
        </div>
      </div>

      <p className="input-help">
        At least 8 characters, with an uppercase letter, a lowercase letter, and a digit.
      </p>

      {serverErrors.length > 0 && (
        <ul className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
          {serverErrors.map((msg, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 text-danger-500">•</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-surface-border pt-4 dark:border-secondary-700">
        <div className="min-h-[1.25rem] text-xs">
          {success ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success-600 dark:text-success-400">
              <svg
                aria-hidden
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Password updated
            </span>
          ) : (
            <span className="text-text-muted">
              You will stay signed in on this device.
            </span>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          {mutation.isPending ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Password strength (visual only — authoritative rules live in Zod + backend)
// ---------------------------------------------------------------------------

function scorePassword(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

function StrengthMeter({ strength }: { strength: 0 | 1 | 2 | 3 | 4 }) {
  const tones = [
    'bg-secondary-200 dark:bg-secondary-700',
    'bg-danger-400',
    'bg-warning-400',
    'bg-accent-400',
    'bg-accent-500',
  ];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const active = tones[strength];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? active : 'bg-secondary-200 dark:bg-secondary-700'
            }`}
          />
        ))}
      </div>
      <span className="w-12 text-right text-[0.65rem] font-medium uppercase tracking-wider text-text-muted">
        {labels[strength]}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="rise-in" style={{ animationDelay: '0ms' }}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Your profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage how you appear in invenTU and keep your sign-in credentials current.
        </p>
      </header>

      <div className="rise-in" style={{ animationDelay: '60ms' }}>
        <IdentityHero />
      </div>

      <div
        className="rise-in overflow-hidden rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800"
        style={{ animationDelay: '120ms' }}
      >
        <Section
          eyebrow="Profile"
          title="Display name"
          description="Shown on the top bar, activity logs, and anywhere your name appears inside the app."
        >
          <UpdateNameForm />
        </Section>

        <div className="border-t border-surface-border dark:border-secondary-700" />

        <Section
          eyebrow="Security"
          title="Change password"
          description="You will need your current password. Choose something you don't use elsewhere."
          tone="security"
        >
          <ChangePasswordForm />
        </Section>
      </div>
    </div>
  );
}
