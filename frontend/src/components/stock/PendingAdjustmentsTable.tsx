import { useState } from "react";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  usePendingAdjustments,
  useApproveAdjustment,
  useRejectAdjustment,
  type StockAdjustment,
} from "../../lib/hooks/useStockAdjustments";

interface RejectModalState {
  adjustment: StockAdjustment;
  reason: string;
}

function DeltaCell({ delta }: { delta: number }) {
  const sign = delta >= 0 ? "+" : "";
  const color =
    delta > 0
      ? 'var(--color-ok)'
      : delta < 0
        ? 'var(--color-crit)'
        : 'var(--color-ink-3)';
  return (
    <span className="tnum" style={{ fontWeight: 600, color }}>
      {sign}{delta}
    </span>
  );
}

export default function PendingAdjustmentsTable() {
  const { data: pending, isLoading, isError } = usePendingAdjustments();
  const approve = useApproveAdjustment();
  const reject = useRejectAdjustment();

  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [actionError, setActionError] = useState<string | undefined>();

  async function handleApprove(adj: StockAdjustment) {
    setActionError(undefined);
    try {
      await approve.mutateAsync({ id: adj.movementId, input: {} });
    } catch (err) {
      setActionError(extractAuthErrorMessage(err));
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return;
    setActionError(undefined);
    try {
      await reject.mutateAsync({
        id: rejectModal.adjustment.movementId,
        input: { reason: rejectModal.reason || undefined },
      });
      setRejectModal(null);
    } catch (err) {
      setActionError(extractAuthErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="h-6 w-48 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse" style={{ background: 'var(--color-bg-sunk)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="info-card" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
        Failed to load pending adjustments.
      </div>
    );
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-title">PENDING ADJUSTMENTS</span>
            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>
              {pending?.length ?? 0} ADJUSTMENT
              {pending?.length !== 1 ? "S" : ""} AWAITING YOUR REVIEW
            </p>
          </div>
        </div>

        {actionError && (
          <div className="info-card mx-4 mt-3" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
            {actionError}
          </div>
        )}

        {!pending?.length ? (
          <div className="panel-body">
            <div className="empty">
              <div className="micro mb-2">EMPTY</div>
              No adjustments are pending approval.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th className="num">Previous</th>
                  <th className="num">Counted</th>
                  <th className="num">Delta</th>
                  <th>Submitted</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {pending.map((adj) => (
                  <tr key={adj.movementId}>
                    <td className="strong">{adj.productName}</td>
                    <td className="sku">{adj.warehouseName} / {adj.fullLocationCode}</td>
                    <td className="num">{adj.previousQuantity}</td>
                    <td className="num">{adj.countedQuantity}</td>
                    <td className="num">
                      <DeltaCell delta={adj.delta} />
                    </td>
                    <td className="sku">{new Date(adj.createdAt).toLocaleDateString()}</td>
                    <td className="max-w-[180px] truncate" style={{ color: 'var(--color-ink-3)' }}>
                      {adj.notes ?? "—"}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() => handleApprove(adj)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() =>
                            setRejectModal({ adjustment: adj, reason: "" })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="modal-overlay" onClick={() => !reject.isPending && setRejectModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <p className="modal-sub">CONFIRM</p>
                <h2 id="reject-modal-title" className="modal-title">Reject adjustment</h2>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--color-ink-3)' }}>Rejecting will leave stock levels unchanged.</p>
                <div className="field mt-4">
                  <span className="field-label">Reason (optional)</span>
                  <input
                    id="reject-reason"
                    type="text"
                    className="input"
                    placeholder="e.g. Count appears inaccurate"
                    value={rejectModal.reason}
                    onChange={(e) =>
                      setRejectModal((m) => (m ? { ...m, reason: e.target.value } : m))
                    }
                  />
                </div>
                {actionError && <p className="input-error-msg mt-3">{actionError}</p>}
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={reject.isPending}
                  onClick={() => {
                    setRejectModal(null);
                    setActionError(undefined);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={reject.isPending}
                  onClick={handleRejectConfirm}
                >
                  {reject.isPending ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
