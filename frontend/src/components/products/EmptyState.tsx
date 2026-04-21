interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-surface-border bg-surface px-6 py-16 text-center dark:border-secondary-700 dark:bg-secondary-800">
      <svg
        aria-hidden
        className="mb-4 h-10 w-10 text-text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-outline btn-sm mt-4" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
