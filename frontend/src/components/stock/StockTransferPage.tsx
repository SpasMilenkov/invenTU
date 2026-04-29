import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { transferStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useTransferStock,
  type StockTransferResult,
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

type FormValues = z.infer<typeof transferStockSchema>;

const INITIAL: FormValues = {
  srcWarehouseId: "",
  srcZone: "",
  srcLocationId: "",
  dstWarehouseId: "",
  dstZone: "",
  dstLocationId: "",
  productId: "",
  quantity: "",
  notes: "",
};

interface SuccessInfo {
  result: StockTransferResult;
  srcLocationCode: string;
  dstLocationCode: string;
}

function StockTransferForm() {
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
    resolver: zodResolver(transferStockSchema),
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const srcWarehouseId = watch("srcWarehouseId");
  const srcLocationId = watch("srcLocationId");
  const dstWarehouseId = watch("dstWarehouseId");
  const dstLocationId = watch("dstLocationId");
  const productId = watch("productId");
  const quantityStr = watch("quantity");
  const qty = parseFloat(quantityStr) || 0;

  const srcLocations = useStockLocations(srcWarehouseId || null);
  const dstLocations = useStockLocations(dstWarehouseId || null);
  const srcStock = useStockItemsForLocation(
    productId || null,
    srcWarehouseId || null,
  );
  const dstStock = useStockItemsForLocation(
    productId || null,
    dstWarehouseId || null,
  );
  const transfer = useTransferStock();

  const srcLocationCode = useMemo(
    () =>
      srcLocations.data?.find((l) => l.id === srcLocationId)
        ?.fullLocationCode ?? "",
    [srcLocations.data, srcLocationId],
  );
  const dstLocationCode = useMemo(
    () =>
      dstLocations.data?.find((l) => l.id === dstLocationId)
        ?.fullLocationCode ?? "",
    [dstLocations.data, dstLocationId],
  );

  const srcCurrent =
    srcStock.data?.find((i) => i.stockLocationId === srcLocationId)
      ?.quantityAvailable ?? 0;
  const dstCurrent =
    dstStock.data?.find((i) => i.stockLocationId === dstLocationId)?.quantity ??
    0;
  const srcAfter = Math.max(0, srcCurrent - qty);
  const dstAfter = dstCurrent + qty;
  const overdraw = qty > 0 && qty > srcCurrent && !!srcLocationId && !!productId;
  const visualMax = Math.max(srcCurrent, dstAfter, 1);

  const stepIndex =
    !srcLocationId
      ? 0
      : !productId
        ? 1
        : !dstLocationId
          ? 2
          : qty <= 0
            ? 3
            : 4;

  function setSrcWarehouse(id: string) {
    setValue("srcWarehouseId", id, { shouldValidate: true });
    setValue("srcZone", "");
    setValue("srcLocationId", "");
  }
  function setSrcZone(z: string) {
    setValue("srcZone", z);
    setValue("srcLocationId", "");
  }
  function setSrcLocation(id: string) {
    setValue("srcLocationId", id, { shouldValidate: true });
  }
  function setDstWarehouse(id: string) {
    setValue("dstWarehouseId", id, { shouldValidate: true });
    setValue("dstZone", "");
    setValue("dstLocationId", "");
  }
  function setDstZone(z: string) {
    setValue("dstZone", z);
    setValue("dstLocationId", "");
  }
  function setDstLocation(id: string) {
    setValue("dstLocationId", id, { shouldValidate: true });
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(undefined);
    try {
      const result = await transfer.mutateAsync({
        sourceWarehouseId: data.srcWarehouseId,
        sourceStockLocationId: data.srcLocationId,
        destinationWarehouseId: data.dstWarehouseId,
        destinationStockLocationId: data.dstLocationId,
        productId: data.productId,
        quantity: parseFloat(data.quantity),
        notes: data.notes || undefined,
      });
      const srcCode = srcLocationCode || data.srcLocationId;
      const dstCode = dstLocationCode || data.dstLocationId;
      setSuccess({ result, srcLocationCode: srcCode, dstLocationCode: dstCode });
      toast.success(
        `Transferred ${result.quantity} of ${result.productName}`,
      );
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  };

  if (success) {
    const { result, srcLocationCode: srcCode, dstLocationCode: dstCode } =
      success;
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">TRANSFER CONFIRMED</span>
          <span className="tag tag-ok">SUCCESS</span>
        </div>
        <div className="panel-body">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            Transfer completed successfully
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
              Quantity
            </dt>
            <dd className="tnum strong">{result.quantity}</dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              From
            </dt>
            <dd className="strong">
              {result.sourceWarehouseName} — <span className="sku">{srcCode}</span>
            </dd>
            <dt
              className="font-mono text-[10.5px] uppercase tracking-wider"
              style={{ color: "var(--color-ink-3)" }}
            >
              To
            </dt>
            <dd className="strong">
              {result.destinationWarehouseName} —{" "}
              <span className="sku">{dstCode}</span>
            </dd>
          </dl>
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => {
              setSuccess(null);
              reset(INITIAL);
            }}
          >
            Transfer another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / TRANSFER</div>
          <h1 className="page-title">Transfer stock</h1>
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--color-ink-3)" }}
          >
            Move stock between locations or warehouses.
          </p>
        </div>
        <FlowSteps
          steps={["From", "Item", "To", "Quantity", "Confirm"]}
          current={stepIndex}
        />
      </div>

      {/* Controls grid */}
      <div className="stock-grid cols-3">
        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">01</div>
            <div>
              <h3 className="form-section-title">Source</h3>
              <div className="form-section-hint">From which bin</div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="srcWarehouseId"
              render={({ field }) => (
                <LocationPanel
                  variant="src"
                  caption="FROM"
                  hint={srcLocationCode || undefined}
                  prefix="src-"
                  warehouseId={field.value}
                  onWarehouseChange={setSrcWarehouse}
                  zone={watch("srcZone")}
                  onZoneChange={setSrcZone}
                  locationId={srcLocationId}
                  onLocationChange={setSrcLocation}
                  warehouseError={errors.srcWarehouseId?.message}
                  locationError={errors.srcLocationId?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <div className="form-section-step">02</div>
            <div>
              <h3 className="form-section-title">Item &amp; quantity</h3>
              <div className="form-section-hint">What to move</div>
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
              <label className="input-label" htmlFor="xfer-qty">
                Quantity
              </label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <QtyStepper
                    id="xfer-qty"
                    value={field.value}
                    onChange={(next) =>
                      setValue("quantity", next, { shouldValidate: true })
                    }
                    max={
                      srcLocationId && productId ? srcCurrent : undefined
                    }
                    hasError={!!errors.quantity || overdraw}
                  />
                )}
              />
              {errors.quantity && (
                <p className="input-error-msg">{errors.quantity.message}</p>
              )}
              {srcLocationId && productId && (
                <p
                  className="font-mono text-[10.5px] uppercase tracking-wider mt-1"
                  style={{
                    color: overdraw
                      ? "var(--color-crit)"
                      : "var(--color-ink-3)",
                  }}
                >
                  SOURCE AVAILABLE:{" "}
                  <span
                    className="tnum"
                    style={{
                      color: "var(--color-ink)",
                      fontWeight: 600,
                    }}
                  >
                    {srcCurrent}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="xfer-notes">
                Notes{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <input
                    {...field}
                    id="xfer-notes"
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
            <div className="form-section-step">03</div>
            <div>
              <h3 className="form-section-title">Destination</h3>
              <div className="form-section-hint">Into which bin</div>
            </div>
          </div>
          <div className="form-section-body">
            <Controller
              control={control}
              name="dstWarehouseId"
              render={({ field }) => (
                <LocationPanel
                  variant="dst"
                  caption="TO"
                  hint={dstLocationCode || undefined}
                  prefix="dst-"
                  warehouseId={field.value}
                  onWarehouseChange={setDstWarehouse}
                  zone={watch("dstZone")}
                  onZoneChange={setDstZone}
                  locationId={dstLocationId}
                  onLocationChange={setDstLocation}
                  warehouseError={errors.dstWarehouseId?.message}
                  locationError={errors.dstLocationId?.message}
                />
              )}
            />
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
          <strong>Overdraw:</strong> source location only holds {srcCurrent}.
          Reduce the quantity or pick a different source.
        </p>
      )}

      {/* A → B rail */}
      <div className="transfer-rail">
        <div className="transfer-bin-card src">
          <div className="transfer-bin-header">
            <span className="micro">FROM</span>
            <span className="sku strong">
              {srcLocationCode || "— pick a source —"}
            </span>
          </div>
          <div className="transfer-bin-viz">
            <div className="bin-tower">
              <div
                className="bin-tower-stay"
                style={{ height: `${(srcAfter / visualMax) * 100}%` }}
              />
              <div
                className="bin-tower-leave"
                style={{
                  height: `${(Math.min(qty, srcCurrent) / visualMax) * 100}%`,
                  bottom: `${(srcAfter / visualMax) * 100}%`,
                }}
              />
            </div>
            <div className="bin-tower-numbers">
              <div>
                <span className="micro">NOW</span>
                <span className="num">
                  {srcLocationId && productId ? srcCurrent : "—"}
                </span>
              </div>
              <div>
                <span className="micro">AFTER</span>
                <span className={`num${overdraw ? " crit" : ""}`}>
                  {srcLocationId && productId ? srcAfter : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="transfer-track">
          <div className="transfer-track-rail">
            <div className="transfer-track-pkg">
              <div className="transfer-track-pkg-qty">
                {qty > 0 ? `+${qty}` : "—"}
              </div>
              <div className="transfer-track-pkg-sku">
                {productId ? "in transit" : "no product"}
              </div>
            </div>
          </div>
          <div className="transfer-track-meta">
            <span>{productId ? "selected product" : "PICK A PRODUCT"}</span>
          </div>
        </div>

        <div className="transfer-bin-card dst">
          <div className="transfer-bin-header">
            <span className="micro">TO</span>
            <span className="sku strong">
              {dstLocationCode || "— pick a destination —"}
            </span>
          </div>
          <div className="transfer-bin-viz">
            <div className="bin-tower">
              <div
                className="bin-tower-stay"
                style={{ height: `${(dstCurrent / visualMax) * 100}%` }}
              />
              <div
                className="bin-tower-arrive"
                style={{
                  height: `${(qty / visualMax) * 100}%`,
                  bottom: `${(dstCurrent / visualMax) * 100}%`,
                }}
              />
            </div>
            <div className="bin-tower-numbers">
              <div>
                <span className="micro">NOW</span>
                <span className="num">
                  {dstLocationId && productId ? dstCurrent : "—"}
                </span>
              </div>
              <div>
                <span className="micro">AFTER</span>
                <span className="num">
                  {dstLocationId && productId ? dstAfter : "—"}
                </span>
              </div>
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
        caption="TRANSFER SUMMARY"
        headline={
          <>
            <span className="commit-delta info">{qty}</span>
            <span className="sku">{productId ? "selected" : "—"}</span>
            <span className="commit-arrow">·</span>
            <span className="sku">{srcLocationCode || "—"}</span>
            <span className="commit-arrow">→</span>
            <span className="sku">{dstLocationCode || "—"}</span>
          </>
        }
        primaryLabel={`Move ${qty || ""}`.trim()}
        primaryDisabled={
          !srcLocationId ||
          !dstLocationId ||
          !productId ||
          qty <= 0 ||
          overdraw
        }
        primaryLoading={isSubmitting}
        loadingLabel="Transferring…"
      />
    </form>
  );
}

function StockTransferPageInner() {
  return (
    <div className="flex w-full flex-col gap-5 flex-1">
      <StockSubNav active="transfer" />
      <StockTransferForm />
    </div>
  );
}

export default function StockTransferPage() {
  return (
    <QueryProvider>
      <StockTransferPageInner />
    </QueryProvider>
  );
}
