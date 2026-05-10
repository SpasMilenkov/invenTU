import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useSubmitAdjustment,
  type StockAdjustment,
  type SubmitAdjustmentInput,
} from "../../lib/hooks/useStockAdjustments";
import {
  useStockLocations,
  useStockItemsForLocation,
} from "../../lib/hooks/useReferenceData";
import LocationPanel from "./shared/LocationPanel";
import ProductSelector from "./shared/ProductSelector";
import FlowSteps from "./shared/FlowSteps";
import CommitBar from "./shared/CommitBar";

interface FormValues {
  warehouseId: string;
  zone: string;
  stockLocationId: string;
  productId: string;
  countedQuantity: string;
  reasonCode: string;
  referenceNumber: string;
  notes: string;
}

const INITIAL: FormValues = {
  warehouseId: "",
  zone: "",
  stockLocationId: "",
  productId: "",
  countedQuantity: "",
  reasonCode: "",
  referenceNumber: "",
  notes: "",
};

const REASONS: {
  id: string;
  label: string;
  desc: string;
  iconPath: string;
}[] = [
  {
    id: "CYCLE_COUNT",
    label: "Cycle count",
    desc: "Routine inventory verification",
    iconPath: "M3 6 H21 M3 12 H21 M3 18 H21",
  },
  {
    id: "DAMAGE",
    label: "Damage",
    desc: "Goods damaged in handling",
    iconPath: "M6 6 L18 18 M18 6 L6 18",
  },
  {
    id: "SHRINKAGE",
    label: "Shrinkage",
    desc: "Loss / theft / unaccounted",
    iconPath: "M12 5 V19 M7 14 L12 19 L17 14",
  },
  {
    id: "FOUND",
    label: "Found",
    desc: "Stock located, not in system",
    iconPath: "M12 5 V19 M5 12 H19",
  },
];

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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const warehouseId = watch("warehouseId");
  const stockLocationId = watch("stockLocationId");
  const productId = watch("productId");
  const countedStr = watch("countedQuantity");
  const reasonCode = watch("reasonCode");
  const notes = watch("notes");

  const locations = useStockLocations(warehouseId || null);
  const stockItems = useStockItemsForLocation(
    productId || null,
    warehouseId || null,
  );
  const submit = useSubmitAdjustment();

  const locationCode = useMemo(
    () =>
      locations.data?.find((l) => l.id === stockLocationId)?.fullLocationCode ??
      "",
    [locations.data, stockLocationId],
  );

  const expected =
    stockItems.data?.find((i) => i.stockLocationId === stockLocationId)
      ?.quantity ?? 0;
  const counted = countedStr === "" ? null : parseInt(countedStr, 10) || 0;
  const delta = counted === null ? 0 : counted - expected;
  const variancePct = expected === 0 ? 0 : (delta / expected) * 100;
  const exceedsThreshold = counted !== null && Math.abs(variancePct) > 10;

  // 5-step strip: Location, Item, Count, Reason, Confirm.
  const stepIndex = !stockLocationId
    ? 0
    : !productId
      ? 1
      : counted === null
        ? 2
        : !reasonCode
          ? 3
          : 4;

  function handleWarehouseChange(id: string) {
    setValue("warehouseId", id);
    setValue("zone", "");
    setValue("stockLocationId", "");
  }
  function handleZoneChange(z: string) {
    setValue("zone", z);
    setValue("stockLocationId", "");
  }

  async function onSubmit(values: FormValues) {
    setServerError(undefined);
    if (!values.warehouseId) return setServerError("Warehouse is required.");
    if (!values.stockLocationId)
      return setServerError("Location is required.");
    if (!values.productId) return setServerError("Product is required.");
    if (values.countedQuantity === "")
      return setServerError("Counted quantity is required.");

    const reasonNote = values.reasonCode ? `[${values.reasonCode}]` : "";
    const combinedNotes = [reasonNote, values.notes.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    try {
      const payload: SubmitAdjustmentInput = {
        warehouseId: values.warehouseId,
        stockLocationId: values.stockLocationId,
        productId: values.productId,
        countedQuantity: parseFloat(values.countedQuantity),
        referenceNumber: values.referenceNumber || undefined,
        notes: combinedNotes || undefined,
      };
      const result = await submit.mutateAsync(payload);
      setSubmitted(result);
      reset(INITIAL);
      toast.success(
        result.status === "PendingApproval"
          ? "Adjustment queued for manager review"
          : "Adjustment applied",
      );
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
            <span
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Product
            </span>
            <span className="strong">{submitted.productName}</span>
            <span
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Location
            </span>
            <span className="sku">{submitted.fullLocationCode}</span>
            <span
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Previous qty
            </span>
            <span className="tnum strong">{submitted.previousQuantity}</span>
            <span
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Counted qty
            </span>
            <span className="tnum strong">{submitted.countedQuantity}</span>
            <span
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Delta
            </span>
            <span
              className="tnum strong"
              style={{
                color:
                  submitted.delta >= 0
                    ? "var(--color-ok)"
                    : "var(--color-crit)",
              }}
            >
              {submitted.delta >= 0 ? "+" : ""}
              {submitted.delta}
            </span>
            {submitted.notes && (
              <>
                <span
                  className="font-mono text-[10.5px] uppercase tracking-wider"
                  style={{ color: "var(--color-ink-3)" }}
                >
                  Notes
                </span>
                <span>{submitted.notes}</span>
              </>
            )}
          </div>
          {submitted.status === "PendingApproval" && (
            <p
              className="info-card mt-4"
              style={{
                borderLeftColor: "var(--color-warn)",
                background: "var(--color-warn-soft)",
                color: "var(--color-warn)",
              }}
            >
              This adjustment exceeds the 10&nbsp;% threshold and has been sent
              for manager approval.
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

  const markerLeft = Math.max(0, Math.min(100, 50 + variancePct * 2));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / ADJUSTMENTS</div>
          <h1 className="page-title">Adjust on-hand quantity</h1>
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--color-ink-3)" }}
          >
            Record physical count discrepancies. Corrections within 10 % apply
            immediately; larger changes need manager approval.
          </p>
        </div>
        <FlowSteps
          steps={["Location", "Item", "Count", "Reason", "Confirm"]}
          current={stepIndex}
        />
      </div>

      {/* Controls grid */}
      <div className="stock-grid cols-2">
        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">01</div>
            <div>
              <h3 className="form-section-title">Where &amp; what</h3>
              <div className="form-section-hint">
                Locate the bin and identify the item being counted
              </div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <LocationPanel
                  caption="WHERE"
                  hint={locationCode || undefined}
                  warehouseId={field.value}
                  onWarehouseChange={handleWarehouseChange}
                  zone={watch("zone")}
                  onZoneChange={handleZoneChange}
                  locationId={stockLocationId}
                  onLocationChange={(id) => setValue("stockLocationId", id)}
                  warehouseError={errors.warehouseId?.message}
                  locationError={errors.stockLocationId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <ProductSelector
                  value={field.value}
                  onChange={(id) => setValue("productId", id)}
                  error={errors.productId?.message}
                />
              )}
            />

            <div>
              <label className="input-label" htmlFor="adj-ref">
                Reference number{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="referenceNumber"
                render={({ field }) => (
                  <input
                    {...field}
                    id="adj-ref"
                    type="text"
                    className="input mono"
                    placeholder="e.g. COUNT-2026-001"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">02</div>
            <div>
              <h3 className="form-section-title">Reason</h3>
              <div className="form-section-hint">Why does the count differ?</div>
            </div>
          </div>
          <div className="reason-grid">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className="reason-card"
                data-active={reasonCode === r.id}
                onClick={() =>
                  setValue("reasonCode", reasonCode === r.id ? "" : r.id)
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                >
                  <path d={r.iconPath} />
                </svg>
                <div>
                  <div className="strong">{r.label}</div>
                  <div className="micro">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="form-section-body">
            <div>
              <label className="input-label" htmlFor="adj-notes">
                Notes{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <input
                    {...field}
                    id="adj-notes"
                    type="text"
                    className="input"
                    placeholder="Any observation about this discrepancy…"
                  />
                )}
              />
              {reasonCode && (
                <p
                  className="font-mono text-[10.5px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--color-ink-3)" }}
                >
                  Will be saved as:{" "}
                  <span style={{ color: "var(--color-ink)" }}>
                    [{reasonCode}]
                    {notes ? ` ${notes}` : ""}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {exceedsThreshold && (
        <p
          className="info-card mt-4"
          style={{
            borderLeftColor: "var(--color-warn)",
            background: "var(--color-warn-soft)",
            color: "var(--color-warn)",
          }}
        >
          <strong>Approval required:</strong> variance of{" "}
          {variancePct.toFixed(1)}% exceeds the 10 % threshold. This adjustment
          will be queued for manager review before posting.
        </p>
      )}

      {/* Diff hero */}
      <div className="diff-hero">
        <div className="diff-pillar expected">
          <div className="diff-label">
            <span>SYSTEM EXPECTS</span>
          </div>
          <div className="diff-value">
            {productId && stockLocationId ? expected.toLocaleString() : "—"}
          </div>
          <div className="diff-sub">
            {productId && stockLocationId
              ? "current on-hand at this location"
              : "pick a location and product"}
          </div>
        </div>

        <div className="diff-arrow">
          <div className="diff-arrow-line" />
          {counted !== null ? (
            <div
              className="diff-delta"
              data-sign={delta >= 0 ? "pos" : "neg"}
              data-warn={exceedsThreshold}
            >
              <span className="diff-delta-num">
                {delta >= 0 ? "+" : ""}
                {delta}
              </span>
              <span className="diff-delta-pct">
                {variancePct >= 0 ? "+" : ""}
                {variancePct.toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="diff-delta-empty">awaiting count…</div>
          )}
        </div>

        <div className="diff-pillar counted">
          <div className="diff-label">
            <span>YOU COUNTED</span>
          </div>
          <Controller
            control={control}
            name="countedQuantity"
            render={({ field }) => (
              <input
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="diff-counted-input"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                disabled={!productId || !stockLocationId}
              />
            )}
          />
          <div className="diff-sub">enter physical count</div>
        </div>

        <div className="diff-bar">
          <div className="diff-bar-track">
            <div className="diff-bar-mid" />
            <div className="diff-bar-threshold left" style={{ left: "30%" }}>
              <span className="micro">−10%</span>
            </div>
            <div className="diff-bar-threshold right" style={{ left: "70%" }}>
              <span className="micro">+10%</span>
            </div>
            {counted !== null && (
              <div
                className="diff-bar-marker"
                data-warn={exceedsThreshold}
                style={{ left: `${markerLeft}%` }}
              >
                <div className="diff-bar-marker-dot" />
              </div>
            )}
          </div>
          <div className="diff-bar-axis">
            <span>−25%</span>
            <span>MATCH</span>
            <span>+25%</span>
          </div>
        </div>
      </div>

      {serverError && (
        <p
          className="info-card mt-4"
          style={{
            borderLeftColor: "var(--color-crit)",
            background: "var(--color-crit-soft)",
            color: "var(--color-crit)",
          }}
        >
          {serverError}
        </p>
      )}

      <CommitBar
        caption="ADJUSTMENT SUMMARY"
        headline={
          <>
            <span className="sku">{productId ? "selected" : "—"}</span>
            <span className="commit-arrow">·</span>
            <span>{productId && stockLocationId ? expected : "—"}</span>
            <span className="commit-arrow">→</span>
            <span className="strong">
              {counted === null ? "—" : counted}
            </span>
            <span
              className={`commit-delta ${delta >= 0 ? "ok" : "crit"}`}
            >
              {counted === null ? "" : `${delta >= 0 ? "+" : ""}${delta}`}
            </span>
          </>
        }
        primaryLabel={
          exceedsThreshold ? "Submit for approval" : "Apply adjustment"
        }
        primaryDisabled={
          !warehouseId ||
          !stockLocationId ||
          !productId ||
          counted === null
        }
        primaryLoading={isSubmitting}
        loadingLabel="Submitting…"
      />
    </form>
  );
}
