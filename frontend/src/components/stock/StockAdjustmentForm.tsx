import { useState } from "react";
import { useForm } from "react-hook-form";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useSubmitAdjustment,
  type StockAdjustment,
  type SubmitAdjustmentInput,
} from "../../lib/hooks/useStockAdjustments";
import {
  useActiveWarehouses,
  useStockLocations,
  useProducts,
} from "../../lib/hooks/useReferenceData";
import { FormField } from "../ui/FormField";

interface FormValues {
  warehouseId: string;
  stockLocationId: string;
  productId: string;
  countedQuantity: string;
  referenceNumber: string;
  notes: string;
}

function StatusBadge({ status }: { status: StockAdjustment["status"] }) {
  const map: Record<StockAdjustment["status"], string> = {
    Active: "badge badge-success",
    PendingApproval: "badge badge-warning",
    Approved: "badge badge-success",
    Rejected: "badge badge-danger",
  };
  const label: Record<StockAdjustment["status"], string> = {
    Active: "Auto-approved",
    PendingApproval: "Pending approval",
    Approved: "Approved",
    Rejected: "Rejected",
  };
  return <span className={map[status]}>{label[status]}</span>;
}

export default function StockAdjustmentForm() {
  const [submitted, setSubmitted] = useState<StockAdjustment | null>(null);
  const [serverError, setServerError] = useState<string | undefined>();
  const [productSearch, setProductSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      warehouseId: "",
      stockLocationId: "",
      productId: "",
      countedQuantity: "",
      referenceNumber: "",
      notes: "",
    },
  });

  const warehouseId = watch("warehouseId");

  const warehouses = useActiveWarehouses();
  const locations = useStockLocations(warehouseId || null);
  const products = useProducts(productSearch);
  const submit = useSubmitAdjustment();

  async function onSubmit(values: FormValues) {
    setServerError(undefined);
    try {
      const payload: SubmitAdjustmentInput = {
        warehouseId: values.warehouseId,
        stockLocationId: values.stockLocationId,
        productId: values.productId,
        countedQuantity: parseFloat(values.countedQuantity),
        referenceNumber: values.referenceNumber || undefined,
        notes: values.notes || undefined,
      };
      const result = await submit.mutateAsync(payload);
      setSubmitted(result);
      reset();
      setProductSearch("");
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-text-primary">
              Adjustment submitted
            </span>
            <StatusBadge status={submitted.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <span className="text-text-muted">Product</span>
            <span className="font-medium text-text-primary">
              {submitted.productName}
            </span>
            <span className="text-text-muted">Location</span>
            <span className="font-medium text-text-primary">
              {submitted.fullLocationCode}
            </span>
            <span className="text-text-muted">Previous qty</span>
            <span className="font-medium text-text-primary">
              {submitted.previousQuantity}
            </span>
            <span className="text-text-muted">Counted qty</span>
            <span className="font-medium text-text-primary">
              {submitted.countedQuantity}
            </span>
            <span className="text-text-muted">Delta</span>
            <span
              className={`font-medium ${submitted.delta >= 0 ? "text-success-600" : "text-danger-600"}`}
            >
              {submitted.delta >= 0 ? "+" : ""}
              {submitted.delta}
            </span>
          </div>
          {submitted.status === "PendingApproval" && (
            <p className="rounded-md bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-900/20 dark:text-warning-400">
              This adjustment exceeds the 10&nbsp;% threshold and has been sent
              for manager approval.
            </p>
          )}
          <button
            type="button"
            className="btn btn-secondary mt-2 self-start"
            onClick={() => setSubmitted(null)}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
      <h2 className="mb-5 text-base font-semibold text-text-primary">
        Submit stock count correction
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {/* Warehouse */}
        <div>
          <label className="input-label" htmlFor="warehouseId">
            Warehouse
          </label>
          <select
            id="warehouseId"
            className={`select${errors.warehouseId ? " input-error" : ""}`}
            {...register("warehouseId", { required: "Warehouse is required." })}
          >
            <option value="">Select warehouse…</option>
            {warehouses.data?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
          {errors.warehouseId && (
            <p className="input-error-msg">{errors.warehouseId.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="input-label" htmlFor="stockLocationId">
            Location
          </label>
          <select
            id="stockLocationId"
            className={`select${errors.stockLocationId ? " input-error" : ""}`}
            disabled={!warehouseId}
            {...register("stockLocationId", {
              required: "Location is required.",
            })}
          >
            <option value="">Select location…</option>
            {locations.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullLocationCode}
              </option>
            ))}
          </select>
          {errors.stockLocationId && (
            <p className="input-error-msg">{errors.stockLocationId.message}</p>
          )}
        </div>

        {/* Product search + select */}
        <div>
          <label className="input-label" htmlFor="productSearch">
            Product
          </label>
          <input
            id="productSearch"
            type="text"
            className="input mb-1"
            placeholder="Search products…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <select
            className={`select${errors.productId ? " input-error" : ""}`}
            {...register("productId", { required: "Product is required." })}
          >
            <option value="">Select product…</option>
            {products.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.sku}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="input-error-msg">{errors.productId.message}</p>
          )}
        </div>

        <FormField
          label="Counted quantity"
          type="number"
          registration={register("countedQuantity", {
            required: "Counted quantity is required.",
            validate: (v) => !isNaN(parseFloat(v)) || "Must be a number.",
          })}
          error={errors.countedQuantity}
          placeholder="0"
        />

        <FormField
          label="Reference number (optional)"
          registration={register("referenceNumber")}
          placeholder="e.g. COUNT-2026-001"
        />

        <FormField
          label="Notes (optional)"
          registration={register("notes")}
          placeholder="Any observations…"
        />

        {serverError && (
          <p className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
            {serverError}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}
