interface Props {
  used: number;
  max: number | null | undefined;
}

export default function CapacityBar({ used, max }: Props) {
  if (!max) {
    return <span style={{ color: 'var(--color-ink-3)' }}>&mdash;</span>;
  }

  const pct = (used / max) * 100;
  const fillWidth = Math.min(pct, 100);
  const tier = pct > 90 ? 'crit' : pct >= 75 ? 'warn' : 'ok';
  const over = used > max;
  const pctLabel = `${Math.round(pct)}%${over ? ' (over)' : ''}`;

  return (
    <div className="capbar">
      <div className="capbar-header">
        <div className="bar capbar-track">
          <div
            className={`bar-fill${tier === 'ok' ? '' : ` ${tier}`}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        <span className={`capbar-pct tnum${tier === 'crit' ? ' capbar-pct-crit' : tier === 'warn' ? ' capbar-pct-warn' : ''}`}>
          {pctLabel}
        </span>
      </div>
      <div className="capbar-ratio tnum">
        {used.toLocaleString()} / {max.toLocaleString()}
      </div>
    </div>
  );
}
