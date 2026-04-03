import { useState } from 'react';
import { useProfile, useUpdateProfile, useChangePassword } from '../../lib/hooks/useProfile';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileValues,
  type ChangePasswordValues,
} from '../../lib/schemas/profile';

// ---------------------------------------------------------------------------
// Profile Info Card
// ---------------------------------------------------------------------------

function ProfileInfoCard() {
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-sm text-text-muted">Loading profile…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Could not load profile. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Profile</h2>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <p className="input-label mb-0.5">Name</p>
          <p className="text-sm text-text-primary">
            {data.firstName} {data.lastName}
          </p>
        </div>
        <div>
          <p className="input-label mb-0.5">Email</p>
          <p className="text-sm text-text-primary">{data.email}</p>
        </div>
        <div>
          <p className="input-label mb-0.5">Role</p>
          <span className="badge badge-primary">{data.role}</span>
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
  const mutation = useUpdateProfile();

  const [values, setValues] = useState<UpdateProfileValues>({
    firstName: data?.firstName ?? '',
    lastName: data?.lastName ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProfileValues, string>>>({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Keep form in sync if profile data loads after mount
  if (data && !values.firstName && !values.lastName) {
    setValues({ firstName: data.firstName, lastName: data.lastName });
  }

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
    } catch {
      setServerError('Failed to update name. Please try again.');
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Update Name</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="input-label" htmlFor="firstName">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            className={`input${errors.firstName ? ' input-error' : ''}`}
            value={values.firstName}
            onChange={(e) => handleChange('firstName', e.currentTarget.value)}
            disabled={mutation.isPending}
          />
          {errors.firstName && <p className="input-error-msg">{errors.firstName}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor="lastName">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            className={`input${errors.lastName ? ' input-error' : ''}`}
            value={values.lastName}
            onChange={(e) => handleChange('lastName', e.currentTarget.value)}
            disabled={mutation.isPending}
          />
          {errors.lastName && <p className="input-error-msg">{errors.lastName}</p>}
        </div>
        {serverError && <p className="input-error-msg">{serverError}</p>}
        {success && (
          <p className="text-xs text-success-600 dark:text-success-400">
            Name updated successfully.
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
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
  const mutation = useChangePassword();

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
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: string[] | string } };
      const data = axiosError?.response?.data;
      if (Array.isArray(data)) {
        setServerErrors(data);
      } else if (typeof data === 'string') {
        setServerErrors([data]);
      } else {
        setServerErrors(['Failed to change password. Please try again.']);
      }
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="input-label" htmlFor="currentPassword">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            className={`input${errors.currentPassword ? ' input-error' : ''}`}
            value={values.currentPassword}
            onChange={(e) => handleChange('currentPassword', e.currentTarget.value)}
            disabled={mutation.isPending}
            autoComplete="current-password"
          />
          {errors.currentPassword && <p className="input-error-msg">{errors.currentPassword}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            className={`input${errors.newPassword ? ' input-error' : ''}`}
            value={values.newPassword}
            onChange={(e) => handleChange('newPassword', e.currentTarget.value)}
            disabled={mutation.isPending}
            autoComplete="new-password"
          />
          {errors.newPassword && <p className="input-error-msg">{errors.newPassword}</p>}
          <p className="input-help">
            Min 8 characters, must include uppercase, lowercase, and a digit.
          </p>
        </div>
        <div>
          <label className="input-label" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`input${errors.confirmPassword ? ' input-error' : ''}`}
            value={values.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.currentTarget.value)}
            disabled={mutation.isPending}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="input-error-msg">{errors.confirmPassword}</p>}
        </div>
        {serverErrors.length > 0 && (
          <ul className="input-error-msg list-disc pl-4">
            {serverErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
        {success && (
          <p className="text-xs text-success-600 dark:text-success-400">
            Password changed successfully.
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <ProfileInfoCard />
      <UpdateNameForm />
      <ChangePasswordForm />
    </div>
  );
}
