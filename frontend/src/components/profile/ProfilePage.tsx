import { useEffect, useState } from 'react';
import { useProfile, useUpdateProfile, useChangePassword } from '../../lib/hooks/useProfile';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileValues,
  type ChangePasswordValues,
} from '../../lib/schemas/profile';
import { Tag } from '../ui/Tag';

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
      ? 'before:bg-[color:var(--color-warn)]'
      : 'before:bg-transparent';

  return (
    <section
      className={`relative grid grid-cols-1 gap-6 px-6 py-7 md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)] md:gap-10 before:absolute before:left-0 before:top-6 before:bottom-6 before:w-[3px] before:content-[''] ${rail}`}
    >
      <div className="md:pr-2">
        {eyebrow && (
          <p className="mb-2 micro" style={{ color: 'var(--color-ink-3)' }}>
            {eyebrow}
          </p>
        )}
        <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-ink-3)' }}>{description}</p>
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
      <div className="panel">
        <div className="panel-body">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-48 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
              <div className="h-3 w-64 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="info-card" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
        Could not load your profile. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">ACCOUNT</span>
        <Tag kind="accent">{data.role || 'Unknown'}</Tag>
      </div>
      <div className="panel-body">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="grid h-16 w-16 place-items-center font-mono text-lg font-bold text-white"
              style={{ background: 'var(--color-accent)' }}
            >
              {getInitials(data.firstName, data.lastName)}
            </div>
            <div>
              <h2 className="text-[20px] font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>
                {data.firstName} {data.lastName}
              </h2>
              <p className="mt-0.5 font-mono text-[11.5px] tracking-wide" style={{ color: 'var(--color-ink-3)' }}>
                {data.email.toUpperCase()}
              </p>
            </div>
          </div>
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

      <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="min-h-[1.25rem] text-[11px] font-mono uppercase tracking-wider">
          {success ? (
            <span style={{ color: 'var(--color-ok)' }}>● SAVED</span>
          ) : dirty ? (
            <span style={{ color: 'var(--color-warn)' }}>UNSAVED CHANGES</span>
          ) : (
            <span style={{ color: 'var(--color-ink-3)' }}>YOUR DISPLAY NAME ACROSS INVENTU</span>
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
        <ul className="info-card text-[12px]" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
          {serverErrors.map((msg, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">•</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="min-h-[1.25rem] text-[11px] font-mono uppercase tracking-wider">
          {success ? (
            <span style={{ color: 'var(--color-ok)' }}>● PASSWORD UPDATED</span>
          ) : (
            <span style={{ color: 'var(--color-ink-3)' }}>
              YOU WILL STAY SIGNED IN ON THIS DEVICE
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
  const colors = [
    'var(--color-bg-sunk)',
    'var(--color-crit)',
    'var(--color-warn)',
    'var(--color-ok)',
    'var(--color-ok)',
  ];
  const labels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];
  const active = colors[strength];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 transition-colors"
            style={{ background: i < strength ? active : 'var(--color-bg-sunk)' }}
          />
        ))}
      </div>
      <span
        className="w-12 text-right font-mono text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--color-ink-3)' }}
      >
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="page-head rise-in" style={{ animationDelay: '0ms' }}>
        <div>
          <div className="page-sub">ADMIN / PROFILE</div>
          <h1 className="page-title">Your profile</h1>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
            Manage how you appear in invenTU and keep your sign-in credentials current.
          </p>
        </div>
      </div>

      <div className="rise-in" style={{ animationDelay: '60ms' }}>
        <IdentityHero />
      </div>

      <div className="rise-in panel" style={{ animationDelay: '120ms', overflow: 'hidden' }}>
        <Section
          eyebrow="Profile"
          title="Display name"
          description="Shown on the top bar, activity logs, and anywhere your name appears inside the app."
        >
          <UpdateNameForm />
        </Section>

        <div style={{ borderTop: '1px solid var(--color-rule)' }} />

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
