import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { logout } from '../../lib/auth/api';
import { queryClient } from '../../lib/query/client';
import QueryProvider from '../providers/QueryProvider';

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || 'U';
}

function UserMenuInner() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: user, isLoading } = useCurrentUser();

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.assign('/login');
    },
  });

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (isLoading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-surface-alt" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary-100 dark:hover:bg-secondary-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {getInitials(user.firstName, user.lastName)}
        </span>
        <span className="hidden text-sm font-medium text-text-primary sm:inline">
          {user.firstName} {user.lastName}
        </span>
        <svg
          className="h-4 w-4 text-text-subtle"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-lg border border-surface-border bg-surface shadow-lg"
        >
          <div className="p-4">
            <p className="text-sm font-semibold text-text-primary">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{user.email}</p>
            {user.roles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-surface-border">
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-secondary-100 disabled:opacity-50 dark:hover:bg-secondary-800"
            >
              {signOut.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserMenu() {
  return (
    <QueryProvider>
      <UserMenuInner />
    </QueryProvider>
  );
}
