import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { issueStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useIssueStock,
  type StockIssueResult,
} from "../../lib/hooks/useStockOperations";
import {
  useStockLocations,
  useStockItemsForLocation,
} from "../../lib/hooks/useReferenceData";
import QueryProvider from "../providers/QueryProvider";
import ProductSelector from "./shared/ProductSelector";
import StockSubNav from "./shared/StockSubNav";
import LocationPanel from "./shared/LocationPanel";
import FlowSteps from "./shared/FlowSteps";
import QtyStepper from "./shared/QtyStepper";
import CommitBar from "./shared/CommitBar";

type FormValues = z.infer<typeof issueStockSchema>;

const INITIAL: FormValues = {
  warehouseId: "",
  zone: "",
  stockLocationId: "",
  productId: "",
  quantity: "",
  reasonCode: "",
  notes: "",
};

interface SuccessInfo {
  result: StockIssueResult;
  locationCode: string;
}

function StockIssueForm() {
  const [serverError, setServerError] = useState<string | undefined>();
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(issueStockSchema),
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const warehouseId = watch("warehouseId");
  const stockLocationId = watch("stockLocationId");
  const productId = watch("productId");
  const quantityStr = watch("quantity");
  const reasonCode = watch("reasonCode");
  const qty = parseFloat(quantityStr) || 0;

  const locations = useStockLocations(warehouseId || null);
  const stockItems = useStockItemsForLocation(
    productId || null,
    warehouseId || null,
  );
  const issue = useIssueStock();

  const locationCode = useMemo(
    () =>
      locations.data?.find((l) => l.id === stockLocationId)?.fullLocationCode ??
      "",
    [locations.data, stockLocationId],
  );

  const item = stockItems.data?.find((i) => i.stockLocationId === stockLocationId);
  const available = item?.quantityAvailable ?? 0;
  const newLevel = Math.max(0, available - qty);
  const overdraw = qty > 0 && qty > available && !!stockLocationId && !!productId;
  const visualMax = Math.max(available, 1);

  const stepIndex =
    !warehouseId
      ? 0
      : !stockLocationId
        ? 1
        : !productId
          ? 2
          : qty <= 0
            ? 3
            : !reasonCode
              ? 4
              : 5;

  function handleWarehouseChange(id: string) {
    setValue("warehouseId", id, { shouldValidate: true });
    setValue("zone", "");
    setValue("stockLocationId", "");
  }
  function handleZoneChange(z: string) {
    setValue("zone", z);
    setValue("stockLocationId", "");
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(undefined);
    try {
      const result = await issue.mutateAsync({
        warehouseId: data.warehouseId,
        stockLocationId: data.stockLocationId,
        productId: data.productId,
        quantity: parseFloat(data.quantity),
        reasonCode: data.reasonCode,
        notes: data.notes || undefined,
      });
      const code = locationCode || data.stockLocationId;
      setSuccess({ result, locationCode: code });
      toast.success(`Issued ${result.quantity} of ${result.productName}`);
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  };

  if (success) {
    const { result, locationCode: code } = success;
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">ISSUE CONFIRMED</span>
          <span className="tag tag-ok">SUCCESS</span>
        </div>
        <div className="panel-body">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            Stock issued successfully
          </h2>
          <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[12.5px]">
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Product
            </dt>
            <dd className="strong">{result.productName}</dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Warehouse
            </dt>
            <dd className="strong">{result.warehouseName}</dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Location
            </dt>
            <dd className="sku">{code}</dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Quantity issued
            </dt>
            <dd
              className="tnum strong"
              style={{ color: "var(--color-crit)" }}
            >
              −{result.quantity}
            </dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Remaining stock
            </dt>
            <dd className="tnum strong">{result.updatedStockLevel}</dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              Reason
            </dt>
            <dd className="strong">{result.reasonCode}</dd>
          </dl>
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => {
              setSuccess(null);
              reset(INITIAL);
            }}
          >
            Issue another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / ISSUE</div>
          <h1 className="page-title">Issue / pick stock</h1>
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--color-ink-3)" }}
          >
            Remove stock from a location for an order, transfer, or other use.
          </p>
        </div>
        <FlowSteps
          steps={["Source", "Location", "Item", "Quantity", "Reason", "Confirm"]}
          current={stepIndex}
        />
      </div>

      {/* Controls grid */}
      <div className="stock-grid cols-2">
        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">01</div>
            <div>
              <h3 className="form-section-title">Source</h3>
              <div className="form-section-hint">
                Where the stock is being picked from
              </div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <LocationPanel
                  variant="src"
                  caption="FROM"
                  hint={locationCode || undefined}
                  warehouseId={field.value}
                  onWarehouseChange={handleWarehouseChange}
                  zone={watch("zone")}
                  onZoneChange={handleZoneChange}
                  locationId={stockLocationId}
                  onLocationChange={(id) =>
                    setValue("stockLocationId", id, { shouldValidate: true })
                  }
                  warehouseError={errors.warehouseId?.message}
                  locationError={errors.stockLocationId?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">02</div>
            <div>
              <h3 className="form-section-title">Item, quantity &amp; reason</h3>
              <div className="form-section-hint">
                What is being issued and why
              </div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <ProductSelector
                  value={field.value}
                  onChange={(id) =>
                    setValue("productId", id, { shouldValidate: true })
                  }
                  error={errors.productId?.message}
                />
              )}
            />

            <div>
              <label className="input-label" htmlFor="issue-qty">
                Quantity to issue
              </label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <QtyStepper
                    id="issue-qty"
                    value={field.value}
                    onChange={(next) =>
                      setValue("quantity", next, { shouldValidate: true })
                    }
                    max={stockLocationId && productId ? available : undefined}
                    hasError={!!errors.quantity || overdraw}
                  />
                )}
              />
              {errors.quantity && (
                <p className="input-error-msg">{errors.quantity.message}</p>
              )}
              {stockLocationId && productId && (
                <p
                  className="font-mono text-[10.5px] uppercase tracking-wider mt-1"
                  style={{
                    color: overdraw
                      ? "var(--color-crit)"
                      : "var(--color-ink-3)",
                  }}
                >
                  AVAILABLE AT THIS LOCATION:{" "}
                  <span
                    className="tnum"
                    style={{
                      color: "var(--color-ink)",
                      fontWeight: 600,
                    }}
                  >
                    {available}
                  </span>
                  {overdraw && " — QUANTITY EXCEEDS AVAILABLE"}
                </p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="issue-reason">
                Reason
              </label>
              <Controller
                control={control}
                name="reasonCode"
                render={({ field }) => (
                  <input
                    {...field}
                    id="issue-reason"
                    type="text"
                    maxLength={100}
                    className={`input${errors.reasonCode ? " input-error" : ""}`}
                    placeholder="e.g. Order #12345, Damaged goods, Sample"
                  />
                )}
              />
              {errors.reasonCode && (
                <p className="input-error-msg">{errors.reasonCode.message}</p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="issue-notes">
                Notes{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <input
                    {...field}
                    id="issue-notes"
                    type="text"
                    className="input"
                    placeholder="Any additional information…"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {overdraw && (
        <p
          className="info-card mt-4"
          style={{
            borderLeftColor: "var(--color-crit)",
            background: "var(--color-crit-soft)",
            color: "var(--color-crit)",
          }}
        >
          <strong>Overdraw:</strong> only {available} available at this location.
          Reduce the quantity or pick a different bin.
        </p>
      )}

      {/* Hero — outbound dock (mirror of Receive) */}
      <div className="receive-dock">
        <div className="dock-bin">
          <div className="dock-bin-cell">
            <div
              className="bin-fill-anim"
              style={{
                height: `${Math.min(100, (newLevel / visualMax) * 100)}%`,
              }}
            />
            <div
              className="bin-fill-anim leaving"
              style={{
                height: `${Math.min(100, (Math.min(qty, available) / visualMax) * 100)}%`,
                bottom: `${Math.min(100, (newLevel / visualMax) * 100)}%`,
              }}
            />
          </div>
          <div className="dock-bin-meta">
            <span className="micro">SOURCE</span>
            <span className="sku">{locationCode || "— pick a location —"}</span>
            <div className="dock-bin-numbers">
              <span>
                <span className="micro">CURRENT</span>
                <span className="num">{stockLocationId ? available : "—"}</span>
              </span>
              <span className="dock-bin-arrow">→</span>
              <span className={`dock-bin-after${overdraw ? " crit" : ""}`}>
                <span className="micro">AFTER</span>
                <span className="num strong">
                  {stockLocationId ? newLevel : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="dock-arrow reverse" aria-hidden="true">
          <span className="micro">DEPARTS TO</span>
          <div className="dock-arrow-line">
            <div className="dock-arrow-head" />
          </div>
        </div>

        <div className="dock-truck outbound">
          <div className="dock-truck-label">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            >
              <rect x="2" y="7" width="11" height="9" />
              <path d="M13 10 H18 L21 13.5 V16 H13 Z" />
              <circle cx="6.5" cy="18" r="1.8" />
              <circle cx="17" cy="18" r="1.8" />
            </svg>
            <div>
              <div className="micro">OUTBOUND</div>
              <div className="strong">{reasonCode || "no reason yet"}</div>
            </div>
          </div>
          <div className="dock-truck-pkg" data-has-product={!!productId}>
            <span className="dock-pkg-qty">{qty > 0 ? `−${qty}` : "—"}</span>
            <span className="dock-pkg-sku">
              {productId ? "ready to depart" : "scan or pick a product"}
            </span>
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
        caption="YOU ARE ABOUT TO ISSUE"
        headline={
          <>
            <span className="commit-delta crit">−{qty}</span>
            <span className="sku">{productId ? "selected" : "—"}</span>
            <span className="commit-arrow">from</span>
            <span className="sku">{locationCode || "—"}</span>
          </>
        }
        primaryLabel={`Issue ${qty || ""}`.trim()}
        primaryDisabled={
          !warehouseId ||
          !stockLocationId ||
          !productId ||
          qty <= 0 ||
          overdraw ||
          !reasonCode
        }
        primaryLoading={isSubmitting}
        loadingLabel="Issuing…"
      />
    </form>
  );
}

function StockIssuePageInner() {
  return (
    <div className="flex w-full flex-col gap-5 flex-1">
      <StockSubNav active="issue" />
      <StockIssueForm />
    </div>
  );
}

export default function StockIssuePage() {
  return (
    <QueryProvider>
      <StockIssuePageInner />
    </QueryProvider>
  );
}
