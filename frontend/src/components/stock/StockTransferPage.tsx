import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { transferStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useTransferStock,
  type StockTransferResult,
} from "../../lib/hooks/useStockOperations";
import { useStockLocations } from "../../lib/hooks/useReferenceData";
import QueryProvider from "../providers/QueryProvider";
import LocationCascade from "./shared/LocationCascade";
import ProductSelector from "./shared/ProductSelector";
import LiveStockDisplay from "./shared/LiveStockDisplay";

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
    formState: { errors, isSubmitting, isValid },
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
  const quantity = watch("quantity");

  const srcLocations = useStockLocations(srcWarehouseId || null);
  const dstLocations = useStockLocations(dstWarehouseId || null);
  const transfer = useTransferStock();

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
      const srcLocationCode =
        srcLocations.data?.find((l) => l.id === data.srcLocationId)
          ?.fullLocationCode ?? data.srcLocationId;
      const dstLocationCode =
        dstLocations.data?.find((l) => l.id === data.dstLocationId)
          ?.fullLocationCode ?? data.dstLocationId;
      setSuccess({ result, srcLocationCode, dstLocationCode });
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    }
  };

  if (success) {
    const { result, srcLocationCode, dstLocationCode } = success;
    return (
      <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-success-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-base font-semibold text-text-primary">
              Transfer completed successfully
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">Product</dt>
            <dd className="font-medium text-text-primary">
              {result.productName}
            </dd>
            <dt className="text-text-muted">Quantity</dt>
            <dd className="font-medium text-text-primary">{result.quantity}</dd>
            <dt className="text-text-muted">From</dt>
            <dd className="font-medium text-text-primary">
              {result.sourceWarehouseName} — {srcLocationCode}
            </dd>
            <dt className="text-text-muted">To</dt>
            <dd className="font-medium text-text-primary">
              {result.destinationWarehouseName} — {dstLocationCode}
            </dd>
          </dl>
          <button
            type="button"
            className="btn btn-secondary mt-2 self-start"
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
    <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
      <h2 className="mb-5 text-base font-semibold text-text-primary">
        Transfer stock
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        {/* Source */}
        <div className="flex flex-col gap-4 rounded-lg border border-surface-border p-4">
          <LocationCascade
            heading="Source"
            prefix="src-"
            warehouseId={srcWarehouseId}
            onWarehouseChange={setSrcWarehouse}
            zone={watch("srcZone")}
            onZoneChange={setSrcZone}
            locationId={srcLocationId}
            onLocationChange={setSrcLocation}
            warehouseError={errors.srcWarehouseId?.message}
            locationError={errors.srcLocationId?.message}
          />
        </div>

        {/* Product + quantity */}
        <div className="flex flex-col gap-4">
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
            <label className="input-label" htmlFor="xfer-quantity">
              Quantity
            </label>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <input
                  {...field}
                  id="xfer-quantity"
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
            <div className="mt-1">
              <LiveStockDisplay
                productId={productId}
                warehouseId={srcWarehouseId}
                locationId={srcLocationId}
                enteredQuantity={parseFloat(quantity) || 0}
              />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-4 rounded-lg border border-surface-border p-4">
          <LocationCascade
            heading="Destination"
            prefix="dst-"
            warehouseId={dstWarehouseId}
            onWarehouseChange={setDstWarehouse}
            zone={watch("dstZone")}
            onZoneChange={setDstZone}
            locationId={dstLocationId}
            onLocationChange={setDstLocation}
            warehouseError={errors.dstWarehouseId?.message}
            locationError={errors.dstLocationId?.message}
          />
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

        {serverError && (
          <p className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
            {serverError}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Transferring…" : "Transfer stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockTransferPageInner() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Stock Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">
          Transfer Stock
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Move stock between locations or warehouses.
        </p>
      </header>
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
