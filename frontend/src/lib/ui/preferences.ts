export type ThemeMode = 'light' | 'dark';
export type Density = 'compact' | 'comfortable';
export type SidebarMode = 'expanded' | 'collapsed';

const THEME_KEY = 'theme';
const DENSITY_KEY = 'density';
const SIDEBAR_KEY = 'sidebar';

const isBrowser = () => typeof window !== 'undefined';

export function getTheme(): ThemeMode {
  if (!isBrowser()) return 'light';
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(mode: ThemeMode) {
  if (!isBrowser()) return;
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function getDensity(): Density {
  if (!isBrowser()) return 'comfortable';
  const stored = localStorage.getItem(DENSITY_KEY);
  return stored === 'compact' ? 'compact' : 'comfortable';
}

export function setDensity(density: Density) {
  if (!isBrowser()) return;
  localStorage.setItem(DENSITY_KEY, density);
  document.documentElement.dataset.density = density;
}

export function getSidebarMode(): SidebarMode {
  if (!isBrowser()) return 'expanded';
  const stored = localStorage.getItem(SIDEBAR_KEY);
  return stored === 'collapsed' ? 'collapsed' : 'expanded';
}

export function setSidebarMode(mode: SidebarMode) {
  if (!isBrowser()) return;
  localStorage.setItem(SIDEBAR_KEY, mode);
  document.documentElement.dataset.collapsed = mode === 'collapsed' ? 'true' : 'false';
}
