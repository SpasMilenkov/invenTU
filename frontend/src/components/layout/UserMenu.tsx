import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { logout } from '../../lib/auth/api';
import { queryClient } from '../../lib/query/client';
import QueryProvider from '../providers/QueryProvider';
import { Icon } from '../ui/Icon';

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
    return <div className="h-8 w-8 animate-pulse bg-[color:var(--color-bg-sunk)]" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${user.firstName} ${user.lastName}`}
      >
        <span
          className="grid h-[22px] w-[22px] place-items-center font-mono text-[10px] font-bold text-white"
          style={{ background: 'var(--color-accent)' }}
        >
          {getInitials(user.firstName, user.lastName)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 border bg-[color:var(--color-paper)] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]"
          style={{ borderColor: 'var(--color-rule-strong)' }}
        >
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--color-rule)' }}>
            <p className="text-[13.5px] font-semibold text-[color:var(--color-ink)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[color:var(--color-ink-3)]">
              {user.email}
            </p>
            {user.roles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <span key={r} className="tag tag-accent">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href="/profile"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-bg-elev)]"
          >
            <Icon name="user" size={14} />
            <span>Profile</span>
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-bg-elev)] disabled:opacity-50"
            style={{ borderTop: '1px solid var(--color-rule)' }}
          >
            <Icon name="logout" size={14} />
            <span>{signOut.isPending ? 'Signing out…' : 'Sign out'}</span>
          </button>
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
