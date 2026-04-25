import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import QueryProvider from '../providers/QueryProvider';
import { Tag } from '../ui/Tag';

function WelcomeCardInner() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div
            className="h-6 w-48 animate-pulse"
            style={{ background: 'var(--color-bg-sunk)' }}
          />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ color: 'var(--color-ink-3)' }}>
          Could not load user information.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Operator</div>
        <span className="micro" style={{ color: 'var(--color-ok)' }}>● ONLINE</span>
      </div>
      <div className="panel-body">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center font-mono text-base font-bold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            {`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-[20px] font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>
              Welcome back, {user.firstName}.
            </h2>
            <p
              className="mt-0.5 font-mono text-[11.5px] tracking-wide"
              style={{ color: 'var(--color-ink-3)' }}
            >
              {user.email.toUpperCase()}
            </p>
          </div>
        </div>
        {user.roles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Tag key={role} kind="accent">
                {role}
              </Tag>
            ))}
          </div>
        )}
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
