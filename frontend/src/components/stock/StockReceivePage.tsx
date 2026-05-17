import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { receiveStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useReceiveStock,
  type StockReceiptResult,
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

type FormValues = z.infer<typeof receiveStockSchema>;

const INITIAL: FormValues = {
  warehouseId: "",
  zone: "",
  stockLocationId: "",
  productId: "",
  quantity: "",
  referenceNumber: "",
  notes: "",
};

interface SuccessInfo {
  result: StockReceiptResult;
  locationCode: string;
}

function StockReceiveForm() {
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
    resolver: zodResolver(receiveStockSchema),
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const warehouseId = watch("warehouseId");
  const stockLocationId = watch("stockLocationId");
  const productId = watch("productId");
  const quantityStr = watch("quantity");
  const referenceNumber = watch("referenceNumber");
  const qty = parseFloat(quantityStr) || 0;

  const locations = useStockLocations(warehouseId || null);
  const stockItems = useStockItemsForLocation(
    productId || null,
    warehouseId || null,
  );
  const receive = useReceiveStock();

  const locationCode = useMemo(
    () =>
      locations.data?.find((l) => l.id === stockLocationId)?.fullLocationCode ??
      "",
    [locations.data, stockLocationId],
  );

  const currentLevel =
    stockItems.data?.find((i) => i.stockLocationId === stockLocationId)
      ?.quantity ?? 0;
  const newLevel = currentLevel + qty;
  const visualMax = Math.max(newLevel, currentLevel, 1);

  const stepIndex =
    !warehouseId
      ? 0
      : !stockLocationId
        ? 1
        : !productId
          ? 2
          : qty <= 0
            ? 3
            : 4;

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
      const result = await receive.mutateAsync({
        warehouseId: data.warehouseId,
        stockLocationId: data.stockLocationId,
        productId: data.productId,
        quantity: parseFloat(data.quantity),
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      const code = locationCode || data.stockLocationId;
      setSuccess({ result, locationCode: code });
      toast.success(`Received ${result.quantity} of ${result.productName}`);
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  };

  if (success) {
    const { result, locationCode: code } = success;
    return (
      <div className="panel" data-testid="stock-receive-confirmation">
        <div className="panel-head">
          <span className="panel-title">RECEIPT CONFIRMED</span>
          <span className="tag tag-ok">SUCCESS</span>
        </div>
        <div className="panel-body">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            Stock received successfully
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
              Quantity received
            </dt>
            <dd
              className="tnum strong"
              style={{ color: "var(--color-ok)" }}
            >
              +{result.quantity}
            </dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              New stock level
            </dt>
            <dd className="tnum strong">{result.updatedStockLevel}</dd>
            {result.referenceNumber && (
              <>
                <dt
                  className="font-mono text-[10.5px] uppercase tracking-wider"
                  style={{ color: "var(--color-ink-3)" }}
                >
                  Reference
                </dt>
                <dd className="sku">{result.referenceNumber}</dd>
              </>
            )}
          </dl>
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => {
              setSuccess(null);
              reset(INITIAL);
            }}
          >
            Receive another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col" data-testid="stock-receive-form">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / RECEIVE</div>
          <h1 className="page-title">Receive stock</h1>
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--color-ink-3)" }}
          >
            Record inbound goods from a purchase order or direct delivery.
          </p>
        </div>
        <FlowSteps
          steps={["Source", "Location", "Item", "Quantity", "Confirm"]}
          current={stepIndex}
        />
      </div>

      {/* Controls grid */}
      <div className="stock-grid cols-2">
        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">01</div>
            <div>
              <h3 className="form-section-title">Source &amp; item</h3>
              <div className="form-section-hint">
                Where it came from · what is being received
              </div>
            </div>
          </div>
          <div className="form-section-body">
            <div>
              <label className="input-label" htmlFor="recv-ref">
                Reference number{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="referenceNumber"
                render={({ field }) => (
                  <input
                    {...field}
                    id="recv-ref"
                    data-testid="stock-receive-ref"
                    type="text"
                    className="input mono"
                    placeholder="e.g. PO-2026-001"
                  />
                )}
              />
            </div>

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
                  selectTestId="stock-receive-product"
                />
              )}
            />

            <div>
              <label className="input-label" htmlFor="recv-qty">
                Quantity received
              </label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <QtyStepper
                    id="recv-qty"
                    dataTestId="stock-receive-qty"
                    value={field.value}
                    onChange={(next) =>
                      setValue("quantity", next, { shouldValidate: true })
                    }
                    hasError={!!errors.quantity}
                  />
                )}
              />
              {errors.quantity && (
                <p className="input-error-msg">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="recv-notes">
                Notes{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <input
                    {...field}
                    id="recv-notes"
                    data-testid="stock-receive-notes"
                    type="text"
                    className="input"
                    placeholder="Any additional information…"
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
              <h3 className="form-section-title">Put-away location</h3>
              <div className="form-section-hint">
                Pick the bin where the pallet lands
              </div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <LocationPanel
                  caption="DESTINATION"
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
                  warehouseTestId="stock-receive-warehouse"
                  locationTestId="stock-receive-location"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Hero — dock door */}
      <div className="receive-dock">
        <div className="dock-truck">
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
              <div className="micro">INBOUND TRUCK</div>
              <div className="strong">{referenceNumber || "no reference yet"}</div>
            </div>
          </div>
          <div
            className="dock-truck-pkg"
            data-has-product={!!productId}
          >
            <span className="dock-pkg-qty">{qty > 0 ? `+${qty}` : "—"}</span>
            <span className="dock-pkg-sku">
              {productId ? "ready to land" : "scan or pick a product"}
            </span>
          </div>
        </div>

        <div className="dock-arrow" aria-hidden="true">
          <span className="micro">ARRIVES AT</span>
          <div className="dock-arrow-line">
            <div className="dock-arrow-head" />
          </div>
        </div>

        <div className="dock-bin">
          <div className="dock-bin-cell">
            <div
              className="bin-fill-anim"
              style={{
                height: `${Math.min(100, (currentLevel / visualMax) * 100)}%`,
              }}
            />
            <div
              className="bin-fill-anim incoming"
              style={{
                height: `${Math.min(100, (qty / visualMax) * 100)}%`,
                bottom: `${Math.min(100, (currentLevel / visualMax) * 100)}%`,
              }}
            />
          </div>
          <div className="dock-bin-meta">
            <span className="micro">DESTINATION</span>
            <span className="sku">{locationCode || "— pick a location —"}</span>
            <div className="dock-bin-numbers">
              <span>
                <span className="micro">CURRENT</span>
                <span className="num">{stockLocationId ? currentLevel : "—"}</span>
              </span>
              <span className="dock-bin-arrow">→</span>
              <span className="dock-bin-after">
                <span className="micro">AFTER</span>
                <span className="num strong">
                  {stockLocationId ? newLevel : "—"}
                </span>
              </span>
            </div>
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
        caption="YOU ARE ABOUT TO RECEIVE"
        headline={
          <>
            <span className="commit-delta ok">+{qty}</span>
            <span className="sku">{productId ? "selected" : "—"}</span>
            <span className="commit-arrow">into</span>
            <span className="sku">{locationCode || "—"}</span>
          </>
        }
        primaryLabel={`Receive ${qty || ""}`.trim()}
        primaryDisabled={
          !warehouseId || !stockLocationId || !productId || qty <= 0
        }
        primaryLoading={isSubmitting}
        loadingLabel="Receiving…"
        primaryTestId="stock-receive-submit"
      />
    </form>
  );
}

function StockReceivePageInner() {
  return (
    <div className="flex w-full flex-col gap-5 flex-1">
      <StockSubNav active="receive" />
      <StockReceiveForm />
    </div>
  );
}

export default function StockReceivePage() {
  return (
    <QueryProvider>
      <StockReceivePageInner />
    </QueryProvider>
  );
}
