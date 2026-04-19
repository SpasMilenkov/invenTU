import type { ReactNode } from 'react';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { getRequiredRoles, hasRequiredRole } from '../../lib/auth/routeRoles';
import QueryProvider from '../providers/QueryProvider';

function RouteGuardInner({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  const { data: user, isLoading, isError, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="h-32 w-full animate-pulse rounded bg-surface-alt" />
      </div>
    );
  }

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const isAuthFailure = !status || status === 401 || status === 403;
    if (isAuthFailure) {
      window.location.assign('/login');
      return null;
    }
    return (
      <div className="flex flex-col items-center gap-4 pt-12 text-center">
        <p className="text-text-muted">Unable to verify your session. Check your connection.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    window.location.assign('/login');
    return null;
  }

  const required = getRequiredRoles(currentPath);
  if (!hasRequiredRole(user.roles, required)) {
    window.location.assign('/403');
    return null;
  }

  return <>{children}</>;
}

export default function RouteGuard({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  return (
    <QueryProvider>
      <RouteGuardInner currentPath={currentPath}>{children}</RouteGuardInner>
    </QueryProvider>
  );
}
