// Ring-style pill classes. Compose with something like
// `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`
// at the call site, so each surface picks its own shape.
export function roleBadgeClasses(role: string): string {
  switch (role) {
    case 'Admin':
      return 'bg-accent-100 text-accent-800 ring-1 ring-accent-300/60 dark:bg-accent-900/40 dark:text-accent-200 dark:ring-accent-600/40';
    case 'Manager':
      return 'bg-primary-100 text-primary-800 ring-1 ring-primary-300/60 dark:bg-primary-900/40 dark:text-primary-200 dark:ring-primary-600/40';
    case 'Worker':
      return 'bg-secondary-100 text-secondary-800 ring-1 ring-secondary-300/60 dark:bg-secondary-700/60 dark:text-secondary-200 dark:ring-secondary-500/40';
    default:
      return 'bg-secondary-100 text-secondary-700 ring-1 ring-secondary-300/60 dark:bg-secondary-800 dark:text-secondary-300 dark:ring-secondary-600/40';
  }
}
