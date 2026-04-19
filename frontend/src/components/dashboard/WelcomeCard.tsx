import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import QueryProvider from '../providers/QueryProvider';

function WelcomeCardInner() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-surface-alt" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface p-6">
        <p className="text-text-muted">Could not load user information.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-text-primary">
        Welcome back, {user.firstName}!
      </h2>
      <p className="mt-1 text-sm text-text-muted">{user.email}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {user.roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WelcomeCard() {
  return (
    <QueryProvider>
      <WelcomeCardInner />
    </QueryProvider>
  );
}
