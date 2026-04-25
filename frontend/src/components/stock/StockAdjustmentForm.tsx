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
    Active: "tag tag-ok",
    PendingApproval: "tag tag-warn",
    Approved: "tag tag-ok",
    Rejected: "tag tag-crit",
  };
  const label: Record<StockAdjustment["status"], string> = {
    Active: "AUTO-APPROVED",
    PendingApproval: "PENDING APPROVAL",
    Approved: "APPROVED",
    Rejected: "REJECTED",
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
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">ADJUSTMENT SUBMITTED</span>
          <StatusBadge status={submitted.status} />
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[12.5px]">
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Product</span>
            <span className="strong">{submitted.productName}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Location</span>
            <span className="sku">{submitted.fullLocationCode}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Previous qty</span>
            <span className="tnum strong">{submitted.previousQuantity}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Counted qty</span>
            <span className="tnum strong">{submitted.countedQuantity}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Delta</span>
            <span className="tnum strong" style={{ color: submitted.delta >= 0 ? 'var(--color-ok)' : 'var(--color-crit)' }}>
              {submitted.delta >= 0 ? '+' : ''}{submitted.delta}
            </span>
          </div>
          {submitted.status === "PendingApproval" && (
            <p className="info-card mt-4" style={{ borderLeftColor: 'var(--color-warn)', background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}>
              This adjustment exceeds the 10&nbsp;% threshold and has been sent for manager approval.
            </p>
          )}
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => setSubmitted(null)}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">SUBMIT STOCK COUNT CORRECTION</span>
      </div>
      <div className="panel-body">
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
          <p className="info-card" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
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
    </div>
  );
}
