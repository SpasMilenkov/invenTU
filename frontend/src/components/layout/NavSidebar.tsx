import { useCurrentUser } from "../../lib/auth/useCurrentUser";
import { getRequiredRoles, hasRequiredRole } from "../../lib/auth/routeRoles";
import QueryProvider from "../providers/QueryProvider";
import { Icon, type IconName } from "../ui/Icon";
import {
  useHealthCheck,
  type HealthStatus,
} from "../../lib/hooks/useHealthCheck";

type NavGroup = "OPERATE" | "MONITOR" | "PROCURE" | "ANALYZE" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  glyph: IconName;
  group: NavGroup;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", glyph: "grid", group: "OPERATE" },
  { label: "Products", href: "/products", glyph: "box", group: "OPERATE" },
  {
    label: "Warehouses",
    href: "/warehouses",
    glyph: "warehouse",
    group: "OPERATE",
  },
  { label: "Stock Ops", href: "/stock", glyph: "scan", group: "OPERATE" },
  { label: "Suppliers", href: "/suppliers", glyph: "truck", group: "PROCURE" },
  { label: "Reports", href: "/reports", glyph: "chart", group: "ANALYZE" },
  { label: "Users", href: "/users", glyph: "users", group: "ADMIN" },
  { label: "Profile", href: "/profile", glyph: "user", group: "ADMIN" },
];

const GROUP_ORDER: NavGroup[] = ["OPERATE", "PROCURE", "ANALYZE", "ADMIN"];

const HEALTH_META: Record<
  HealthStatus,
  { dotClass: string; label: string; title: string }
> = {
  healthy: {
    dotClass: "dot dot--healthy",
    label: "OPERATIONAL",
    title: "API is healthy",
  },
  degraded: {
    dotClass: "dot dot--degraded",
    label: "DEGRADED",
    title: "API is degraded",
  },
  unhealthy: {
    dotClass: "dot dot--unhealthy",
    label: "DEGRADED",
    title: "API is unhealthy",
  },
  unknown: {
    dotClass: "dot dot--unknown",
    label: "UNKNOWN",
    title: "Health status unknown",
  },
};

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "U";
}

function SystemStatus() {
  const { data } = useHealthCheck();
  const status = data?.status ?? "unknown";
  const meta = HEALTH_META[status];

  return (
    <div className="side-status" title={meta.title}>
      <span className={meta.dotClass} />
      <span>{meta.label}</span>
    </div>
  );
}

// ─── Shared nav groups renderer ───────────────────────────────────────────────

function NavGroups({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate?: () => void;
}) {
  const { data: user, isLoading } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasRequiredRole(user?.roles ?? [], getRequiredRoles(item.href)),
  );

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: visibleItems.filter((it) => it.group === g),
  })).filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="mx-3 my-2 h-9 animate-pulse"
            style={{ background: "var(--color-shell-hover)" }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {grouped.map((g) => (
        <div className="nav-section" key={g.group}>
          <div className="nav-section-label">{g.group}</div>
          {g.items.map((it) => {
            const isActive =
              currentPath === it.href ||
              (it.href !== "/" && currentPath.startsWith(it.href + "/")) ||
              (it.href === "/dashboard" && currentPath === "/");
            return (
              <a
                key={it.href}
                href={it.href}
                className="nav-item"
                data-active={isActive}
                title={it.label}
                onClick={onNavigate}
                style={{ minHeight: "48px" }}
              >
                <Icon name={it.glyph} className="nav-glyph" />
                <span className="nav-label">{it.label}</span>
              </a>
            );
          })}
        </div>
      ))}
    </>
  );
}

function NavFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser();
  return (
    <div className="side-foot">
      <SystemStatus />
      {user && (
        <a
          href="/profile"
          className="user-pill"
          title={`${user.firstName} ${user.lastName}`}
          onClick={onNavigate}
        >
          <div className="user-avatar">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="user-pill-text">
            <span className="user-name">
              {user.firstName} {user.lastName}
            </span>
            <span className="user-role">
              {user.roles?.[0]?.toUpperCase() ?? "USER"}
            </span>
          </div>
        </a>
      )}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function NavSidebarInner({ currentPath }: { currentPath: string }) {
  return (
    <>
      <a href="/" className="brand">
        <img className="brand-mark" src="/favicon.svg" />
        <span className="brand-name">InvenTU</span>
        <span className="brand-tag">v0.1</span>
      </a>
      <div className="flex-1 overflow-y-auto">
        <NavGroups currentPath={currentPath} />
      </div>
      <NavFooter />
    </>
  );
}

// ─── Mobile: Top Bar + CSS-driven Drawer ─────────────────────────────────────
// Uses a hidden checkbox + label to toggle the drawer — no JS, no useState.
// The drawer slides in via a CSS transition on the sibling nav element.
// Clicking any nav link closes it naturally (full-page navigation in Astro).

function MobileNav({ currentPath }: { currentPath: string }) {
  const activeItem = NAV_ITEMS.find(
    (it) =>
      currentPath === it.href ||
      (it.href !== "/" && currentPath.startsWith(it.href + "/")) ||
      (it.href === "/dashboard" && currentPath === "/"),
  );

  return (
    <>
      {/* Hidden checkbox — the toggle state lives here, pure CSS */}
      <input
        type="checkbox"
        id="mobile-nav-toggle"
        className="mobile-nav-toggle"
        aria-hidden="true"
      />

      {/* ── Fixed top bar ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b"
        style={{
          background: "var(--color-shell)",
          borderColor: "var(--color-shell-border, rgba(255,255,255,0.08))",
        }}
      >
        <a href="/" className="brand" style={{ marginBottom: 0 }}>
          <img className="brand-mark" src="/favicon.svg"  />
          <span className="brand-name">InvenTU</span>
          <span className="brand-tag">v0.1</span>
        </a>

        {activeItem && (
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--color-nav-muted, rgba(255,255,255,0.4))" }}
          >
            {activeItem.label}
          </span>
        )}

        {/* Hamburger — toggles the checkbox */}
        <label
          htmlFor="mobile-nav-toggle"
          className="mobile-nav-hamburger flex items-center justify-center w-9 h-9 rounded cursor-pointer"
          style={{
            color: "var(--color-nav-fg, rgba(255,255,255,0.75))",
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="Toggle menu"
        >
          {/* Hamburger bars — CSS hides/shows X via sibling selector */}
          <svg
            className="mobile-nav-icon-open"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            />
          </svg>
          <svg
            className="mobile-nav-icon-close"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            />
          </svg>
        </label>
      </header>

      {/* ── Scrim ── */}
      <label
        htmlFor="mobile-nav-toggle"
        className="mobile-nav-scrim md:hidden fixed inset-0 z-40"
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <nav
        className="mobile-nav-drawer md:hidden fixed left-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden"
        style={{
          top: "3.5rem",
          background: "var(--color-shell)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Main navigation"
      >
        <div className="flex-1 overflow-y-auto py-2">
          <NavGroups currentPath={currentPath} />
        </div>
        <NavFooter />
      </nav>

      {/* Spacer so page content clears the top bar */}
      <div className="md:hidden h-14" aria-hidden="true" />
    </>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function NavSidebar({ currentPath }: { currentPath: string }) {
  return (
    <QueryProvider>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col h-full nav-sidebar">
        <NavSidebarInner currentPath={currentPath} />
      </aside>

      {/* Mobile top bar + drawer — hidden on desktop */}
      <MobileNav currentPath={currentPath} />
    </QueryProvider>
  );
}
