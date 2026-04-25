import { useCurrentUser } from "../../lib/auth/useCurrentUser";
import QueryProvider from "../providers/QueryProvider";
import StockAdjustmentForm from "./StockAdjustmentForm";
import PendingAdjustmentsTable from "./PendingAdjustmentsTable";

function StockAdjustmentsPageInner() {
  const { data: user } = useCurrentUser();
  const isManager =
    user?.roles?.some((r) => r === "Manager" || r === "Admin") ?? false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / ADJUSTMENTS</div>
          <h1 className="page-title">Stock adjustments</h1>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
            Record physical count discrepancies. Corrections within 10&nbsp;% are
            applied immediately; larger changes require manager approval.
          </p>
        </div>
      </div>

      <StockAdjustmentForm />

      {isManager && <PendingAdjustmentsTable />}
    </div>
  );
}

export default function StockAdjustmentsPage() {
  return (
    <QueryProvider>
      <StockAdjustmentsPageInner />
    </QueryProvider>
  );
}
