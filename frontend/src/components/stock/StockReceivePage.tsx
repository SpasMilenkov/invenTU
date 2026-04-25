import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { receiveStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useReceiveStock,
  type StockReceiptResult,
} from "../../lib/hooks/useStockOperations";
import { useStockLocations } from "../../lib/hooks/useReferenceData";
import QueryProvider from "../providers/QueryProvider";
import LocationCascade from "./shared/LocationCascade";
import ProductSelector from "./shared/ProductSelector";

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
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(receiveStockSchema),
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const warehouseId = watch("warehouseId");
  const stockLocationId = watch("stockLocationId");

  const locations = useStockLocations(warehouseId || null);
  const receive = useReceiveStock();

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
      const locationCode =
        locations.data?.find((l) => l.id === data.stockLocationId)
          ?.fullLocationCode ?? data.stockLocationId;
      setSuccess({ result, locationCode });
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  };

  if (success) {
    const { result, locationCode } = success;
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">RECEIPT CONFIRMED</span>
          <span className="tag tag-ok">SUCCESS</span>
        </div>
        <div className="panel-body">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
            Stock received successfully
          </h2>
          <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[12.5px]">
            <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Product</dt>
            <dd className="strong">{result.productName}</dd>
            <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Warehouse</dt>
            <dd className="strong">{result.warehouseName}</dd>
            <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Location</dt>
            <dd className="sku">{locationCode}</dd>
            <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Quantity received</dt>
            <dd className="tnum strong" style={{ color: 'var(--color-ok)' }}>+{result.quantity}</dd>
            <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>New stock level</dt>
            <dd className="tnum strong">{result.updatedStockLevel}</dd>
            {result.referenceNumber && (
              <>
                <dt className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Reference</dt>
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
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">RECEIVE STOCK</span>
      </div>
      <div className="panel-body">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Controller
          control={control}
          name="warehouseId"
          render={({ field }) => (
            <LocationCascade
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
          <label className="input-label" htmlFor="recv-quantity">
            Quantity
          </label>
          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <input
                {...field}
                id="recv-quantity"
                type="number"
                min="0"
                step="any"
                className={`input${errors.quantity ? " input-error" : ""}`}
                placeholder="0"
              />
            )}
          />
          {errors.quantity && (
            <p className="input-error-msg">{errors.quantity.message}</p>
          )}
        </div>

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
                type="text"
                className="input"
                placeholder="e.g. PO-2026-001"
              />
            )}
          />
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
                type="text"
                className="input"
                placeholder="Any additional information…"
              />
            )}
          />
        </div>

        {serverError && (
          <p className="info-card" style={{ borderLeftColor: 'var(--color-crit)', background: 'var(--color-crit-soft)', color: 'var(--color-crit)' }}>
            {serverError}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Receiving…" : "Receive stock"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

function StockReceivePageInner() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="page-head">
        <div>
          <div className="page-sub">OPERATE / STOCK / RECEIVE</div>
          <h1 className="page-title">Receive stock</h1>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
            Record inbound stock from a purchase order or direct receipt.
          </p>
        </div>
      </div>
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
