export const ROUTE_ROLES: Record<string, readonly string[]> = {
  '/users': ['Admin', 'Manager'],
  '/categories': ['Admin', 'Manager'],
};

export function getRequiredRoles(pathname: string): readonly string[] | null {
  const match = Object.keys(ROUTE_ROLES)
    .filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_ROLES[match] : null;
}

export function hasRequiredRole(
  userRoles: string[],
  required: readonly string[] | null,
): boolean {
  if (!required) return true;
  return required.some((r) => userRoles.includes(r));
}
