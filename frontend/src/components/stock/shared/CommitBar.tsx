import type { ReactNode } from "react";

interface CommitBarProps {
  caption: string;
  headline: ReactNode;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  loadingLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export default function CommitBar({
  caption,
  headline,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  loadingLabel = "Submitting…",
  onSecondary,
  secondaryLabel = "Reset",
}: CommitBarProps) {
  return (
    <div className="commit-bar">
      <div className="commit-summary">
        <span className="micro">{caption}</span>
        <span className="commit-headline">{headline}</span>
      </div>
      <div className="row">
        {onSecondary && (
          <button
            type="button"
            className="btn"
            onClick={onSecondary}
            disabled={primaryLoading}
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={primaryDisabled || primaryLoading}
        >
          {primaryLoading ? loadingLabel : primaryLabel}
        </button>
      </div>
    </div>
  );
}
