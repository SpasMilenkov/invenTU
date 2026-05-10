export function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n)) {
    return '—';
  }

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}
