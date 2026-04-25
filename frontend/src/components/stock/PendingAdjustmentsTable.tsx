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
  const cls =
    delta > 0
      ? "text-success-600 dark:text-success-400"
      : delta < 0
        ? "text-danger-600 dark:text-danger-400"
        : "text-text-muted";
  return (
    <span className={`font-medium ${cls}`}>
      {sign}
      {delta}
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
      <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded bg-secondary-100 dark:bg-secondary-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
        <p className="text-sm text-danger-600">
          Failed to load pending adjustments.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card border border-surface-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Pending adjustments
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {pending?.length ?? 0} adjustment
              {pending?.length !== 1 ? "s" : ""} awaiting your review
            </p>
          </div>
        </div>

        {actionError && (
          <div className="mx-6 mt-4 rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
            {actionError}
          </div>
        )}

        {!pending?.length ? (
          <div className="px-6 py-10 text-center text-sm text-text-muted">
            No adjustments are pending approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Previous</th>
                  <th>Counted</th>
                  <th>Delta</th>
                  <th>Submitted</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-secondary-700">
                {pending.map((adj) => (
                  <tr key={adj.movementId}>
                    <td>
                      <span className="font-medium text-text-primary">
                        {adj.productName}
                      </span>
                    </td>
                    <td>
                      {adj.warehouseName} / {adj.fullLocationCode}
                    </td>
                    <td>{adj.previousQuantity}</td>
                    <td>{adj.countedQuantity}</td>
                    <td>
                      <DeltaCell delta={adj.delta} />
                    </td>
                    <td>{new Date(adj.createdAt).toLocaleDateString()}</td>
                    <td className="max-w-45 truncate text-text-muted">
                      {adj.notes ?? "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div className="w-full max-w-md rounded-card border border-surface-border bg-surface p-6 shadow-card">
            <h3
              id="reject-modal-title"
              className="text-base font-semibold text-text-primary"
            >
              Reject adjustment
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Rejecting will leave stock levels unchanged.
            </p>
            <div className="mt-4">
              <label className="input-label" htmlFor="reject-reason">
                Reason (optional)
              </label>
              <input
                id="reject-reason"
                type="text"
                className="input"
                placeholder="e.g. Count appears inaccurate"
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((m) =>
                    m ? { ...m, reason: e.target.value } : m,
                  )
                }
              />
            </div>
            {actionError && (
              <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">
                {actionError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
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
      )}
    </>
  );
}
