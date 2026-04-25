import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { getRequiredRoles, hasRequiredRole } from '../../lib/auth/routeRoles';
import QueryProvider from '../providers/QueryProvider';
import { Icon, type IconName } from '../ui/Icon';

type NavGroup = 'OPERATE' | 'MONITOR' | 'PROCURE' | 'ANALYZE' | 'ADMIN';

interface NavItem {
  label: string;
  href: string;
  glyph: IconName;
  group: NavGroup;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',  glyph: 'grid',      group: 'OPERATE' },
  { label: 'Products',      href: '/products',   glyph: 'box',       group: 'OPERATE' },
  { label: 'Warehouses',    href: '/warehouses', glyph: 'warehouse', group: 'OPERATE' },
  { label: 'Stock Ops',     href: '/stock',      glyph: 'scan',      group: 'OPERATE' },
  { label: 'Suppliers',     href: '/suppliers',  glyph: 'truck',     group: 'PROCURE' },
  { label: 'Reports',       href: '/reports',    glyph: 'chart',     group: 'ANALYZE' },
  { label: 'Users',         href: '/users',      glyph: 'users',     group: 'ADMIN' },
  { label: 'Profile',       href: '/profile',    glyph: 'user',      group: 'ADMIN' },
];

const GROUP_ORDER: NavGroup[] = ['OPERATE', 'PROCURE', 'ANALYZE', 'ADMIN'];

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || 'U';
}

function NavSidebarInner({ currentPath }: { currentPath: string }) {
  const { data: user, isLoading } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasRequiredRole(user?.roles ?? [], getRequiredRoles(item.href)),
  );

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: visibleItems.filter((it) => it.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <a href="/" className="brand">
        <span className="brand-mark" />
        <span className="brand-name">InvenTU</span>
        <span className="brand-tag">v0.1</span>
      </a>

      <div className="flex-1 overflow-y-auto">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mx-3 my-2 h-9 animate-pulse"
                style={{ background: 'var(--color-shell-hover)' }}
              />
            ))
          : grouped.map((g) => (
              <div className="nav-section" key={g.group}>
                <div className="nav-section-label">{g.group}</div>
                {g.items.map((it) => {
                  const isActive =
                    currentPath === it.href ||
                    (it.href !== '/' && currentPath.startsWith(it.href + '/')) ||
                    (it.href === '/dashboard' && currentPath === '/');
                  return (
                    <a
                      key={it.href}
                      href={it.href}
                      className="nav-item"
                      data-active={isActive}
                      title={it.label}
                    >
                      <Icon name={it.glyph} className="nav-glyph" />
                      <span className="nav-label">{it.label}</span>
                    </a>
                  );
                })}
              </div>
            ))}
      </div>

      <div className="side-foot">
        <div className="side-status">
          <span className="dot" />
          <span>OPERATIONAL</span>
        </div>
        {user && (
          <a href="/profile" className="user-pill">
            <div className="user-avatar">{getInitials(user.firstName, user.lastName)}</div>
            <div className="flex flex-col leading-tight">
              <span className="user-name">
                {user.firstName} {user.lastName}
              </span>
              <span className="user-role">{user.roles?.[0]?.toUpperCase() ?? 'USER'}</span>
            </div>
          </a>
        )}
      </div>
    </>
  );
}

export default function NavSidebar({ currentPath }: { currentPath: string }) {
  return (
    <QueryProvider>
      <NavSidebarInner currentPath={currentPath} />
    </QueryProvider>
  );
}
