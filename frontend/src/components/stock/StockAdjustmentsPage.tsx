import { useCurrentUser } from "../../lib/auth/useCurrentUser";
import QueryProvider from "../providers/QueryProvider";
import StockAdjustmentForm from "./StockAdjustmentForm";
import PendingAdjustmentsTable from "./PendingAdjustmentsTable";

function StockAdjustmentsPageInner() {
  const { data: user } = useCurrentUser();
  const isManager =
    user?.roles?.some((r) => r === "Manager" || r === "Admin") ?? false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Stock Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">
          Stock Adjustments
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Record physical count discrepancies. Corrections within 10&nbsp;% are
          applied immediately; larger changes require manager approval.
        </p>
      </header>

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
