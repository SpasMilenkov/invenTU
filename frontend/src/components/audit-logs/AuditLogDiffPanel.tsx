import type { AuditAction, ChangedFieldsPayload } from '../../lib/types/auditLogs';

interface Props {
  action: AuditAction;
  changedFields: ChangedFieldsPayload;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--color-ink-3)' }}>—</span>;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    return value === '' ? <span style={{ color: 'var(--color-ink-3)' }}>(empty)</span> : value;
  }
  return (
    <pre
      className="font-mono text-[11px]"
      style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (isPlainObject(a) || isPlainObject(b) || Array.isArray(a) || Array.isArray(b)) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function SingleStatePanel({
  state,
  label,
}: {
  state: Record<string, unknown>;
  label: string;
}) {
  const keys = Object.keys(state).sort();
  return (
    <div>
      <div
        className="font-mono text-[11px]"
        style={{ color: 'var(--color-ink-3)', marginBottom: 6 }}
      >
        {label.toUpperCase()}
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Field</th>
            <th>{label}</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td className="strong">{k}</td>
              <td>{formatValue(state[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateDiffTable({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: '25%' }}>Field</th>
          <th>Before</th>
          <th>After</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => {
          const b = before[k];
          const a = after[k];
          const changed = !valuesEqual(b, a);
          return (
            <tr
              key={k}
              style={{
                background: changed ? 'var(--color-bg-sunk)' : 'transparent',
              }}
            >
              <td className="strong">{k}</td>
              <td>{formatValue(b)}</td>
              <td>{formatValue(a)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function AuditLogDiffPanel({ action, changedFields }: Props) {
  const { before, after } = changedFields;

  if (action === 'Insert' && after) {
    return <SingleStatePanel state={after} label="After" />;
  }
  if (action === 'Delete' && before) {
    return <SingleStatePanel state={before} label="Before" />;
  }
  if (action === 'Update' && before && after) {
    return <UpdateDiffTable before={before} after={after} />;
  }

  return (
    <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
      No diff data is available for this entry.
    </p>
  );
}
