import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { issueStockSchema } from "../../lib/schemas/stock";
import { extractAuthErrorMessage } from "../../lib/auth/errors";
import {
  useIssueStock,
  type StockIssueResult,
} from "../../lib/hooks/useStockOperations";
import { useStockLocations } from "../../lib/hooks/useReferenceData";
import QueryProvider from "../providers/QueryProvider";
import LocationCascade from "./shared/LocationCascade";
import ProductSelector from "./shared/ProductSelector";
import LiveStockDisplay from "./shared/LiveStockDisplay";

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
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(issueStockSchema),
    defaultValues: INITIAL,
    mode: "onTouched",
  });

  const warehouseId = watch("warehouseId");
  const stockLocationId = watch("stockLocationId");
  const productId = watch("productId");
  const quantity = watch("quantity");

  const locations = useStockLocations(warehouseId || null);
  const issue = useIssueStock();

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
              Stock issued successfully
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">Product</dt>
            <dd className="font-medium text-text-primary">
              {result.productName}
            </dd>
            <dt className="text-text-muted">Warehouse</dt>
            <dd className="font-medium text-text-primary">
              {result.warehouseName}
            </dd>
            <dt className="text-text-muted">Location</dt>
            <dd className="font-medium text-text-primary">{locationCode}</dd>
            <dt className="text-text-muted">Quantity issued</dt>
            <dd className="font-medium text-danger-600">−{result.quantity}</dd>
            <dt className="text-text-muted">Remaining stock</dt>
            <dd className="font-medium text-text-primary">
              {result.updatedStockLevel}
            </dd>
            <dt className="text-text-muted">Reason</dt>
            <dd className="font-medium text-text-primary">
              {result.reasonCode}
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
            Issue another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card">
      <h2 className="mb-5 text-base font-semibold text-text-primary">
        Issue / pick stock
      </h2>
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
          <label className="input-label" htmlFor="issue-quantity">
            Quantity
          </label>
          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <input
                {...field}
                id="issue-quantity"
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
              warehouseId={warehouseId}
              locationId={stockLocationId}
              enteredQuantity={parseFloat(quantity) || 0}
            />
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="issue-reason">
            Reason code
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
            {isSubmitting ? "Issuing…" : "Issue stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockIssuePageInner() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted">
          Stock Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">
          Issue / Pick Stock
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Remove stock from a location for an order, transfer, or other use.
        </p>
      </header>
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
