import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { getRequiredRoles, hasRequiredRole } from '../../lib/auth/routeRoles';
import QueryProvider from '../providers/QueryProvider';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Warehouses', href: '/warehouses' },
  { label: 'Stock Operations', href: '/stock' },
  { label: 'Reports', href: '/reports' },
  { label: 'Users', href: '/users' },
  { label: 'Suppliers', href: '/suppliers' },
];

function NavSidebarInner({ currentPath }: { currentPath: string }) {
  const { data: user, isLoading } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasRequiredRole(user?.roles ?? [], getRequiredRoles(item.href)),
  );

  return (
    <>
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <a href="/" className="text-xl font-bold tracking-wide">invenTU</a>
      </div>
      <nav className="mt-4 flex flex-col gap-1 px-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-sidebar-hover-muted"
              />
            ))
          : visibleItems.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== '/' && currentPath.startsWith(item.href));
              const classes = [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-sidebar-text'
                  : 'text-sidebar-text-muted hover:bg-sidebar-hover-muted hover:text-sidebar-text',
              ].join(' ');
              return (
                <a key={item.href} href={item.href} className={classes}>
                  {item.label}
                </a>
              );
            })}
      </nav>
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
