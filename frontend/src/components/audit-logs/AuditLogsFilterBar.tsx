import { useUsersList } from '../../lib/hooks/useUsers';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_TYPE_OPTIONS,
} from '../../lib/types/auditLogs';

interface Props {
  entityType: string;
  action: string;
  userId: string;
  from: string;
  to: string;
  onChange: (patch: Partial<{
    entityType: string;
    action: string;
    userId: string;
    from: string;
    to: string;
  }>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export default function AuditLogsFilterBar({
  entityType,
  action,
  userId,
  from,
  to,
  onChange,
  onClear,
  hasActiveFilters,
}: Props) {
  const users = useUsersList({ page: 1, pageSize: 200 });

  return (
    <div className="toolbar">
      <div className="md:w-48">
        <label className="input-label" htmlFor="al-entity">Entity</label>
        <select
          id="al-entity"
          className="select"
          value={entityType}
          onChange={(e) => onChange({ entityType: e.target.value })}
        >
          <option value="">All entities</option>
          {AUDIT_ENTITY_TYPE_OPTIONS.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>

      <div className="md:w-44">
        <label className="input-label" htmlFor="al-action">Action</label>
        <select
          id="al-action"
          className="select"
          value={action}
          onChange={(e) => onChange({ action: e.target.value })}
        >
          <option value="">All actions</option>
          {AUDIT_ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="md:w-72">
        <label className="input-label" htmlFor="al-user">Changed by</label>
        <select
          id="al-user"
          className="select"
          value={userId}
          disabled={users.isLoading}
          onChange={(e) => onChange({ userId: e.target.value })}
        >
          <option value="">Any user</option>
          {users.data?.items.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} — {u.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="input-label" htmlFor="al-from">From</label>
        <input
          id="al-from"
          type="date"
          className="input"
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </div>

      <div>
        <label className="input-label" htmlFor="al-to">To</label>
        <input
          id="al-to"
          type="date"
          className="input"
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </div>

      {hasActiveFilters && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
