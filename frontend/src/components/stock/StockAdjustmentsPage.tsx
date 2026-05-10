import { useCurrentUser } from "../../lib/auth/useCurrentUser";
import QueryProvider from "../providers/QueryProvider";
import StockAdjustmentForm from "./StockAdjustmentForm";
import PendingAdjustmentsTable from "./PendingAdjustmentsTable";
import StockSubNav from "./shared/StockSubNav";

function StockAdjustmentsPageInner() {
  const { data: user } = useCurrentUser();
  const isManager =
    user?.roles?.some((r) => r === "Manager" || r === "Admin") ?? false;

  return (
    <div className="flex w-full flex-col gap-5 flex-1">
      <StockSubNav active="adjustments" />
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
