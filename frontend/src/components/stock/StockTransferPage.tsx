import { useState } from "react";
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

interface FormState {
  srcWarehouseId: string;
  srcZone: string;
  srcLocationId: string;
  dstWarehouseId: string;
  dstZone: string;
  dstLocationId: string;
  productId: string;
  quantity: string;
  notes: string;
}

const INITIAL: FormState = {
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

type FormErrors = Partial<Record<keyof FormState, string>>;

interface SuccessInfo {
  result: StockTransferResult;
  srcLocationCode: string;
  dstLocationCode: string;
}

function StockTransferForm() {
  const [form, setFormState] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | undefined>();
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const srcLocations = useStockLocations(form.srcWarehouseId || null);
  const dstLocations = useStockLocations(form.dstWarehouseId || null);
  const transfer = useTransferStock();

  function setField(field: keyof FormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setSrcWarehouse(id: string) {
    setFormState((prev) => ({
      ...prev,
      srcWarehouseId: id,
      srcZone: "",
      srcLocationId: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.srcWarehouseId;
      return next;
    });
  }

  function setSrcZone(zone: string) {
    setFormState((prev) => ({ ...prev, srcZone: zone, srcLocationId: "" }));
  }

  function setSrcLocation(id: string) {
    setField("srcLocationId", id);
  }

  function setDstWarehouse(id: string) {
    setFormState((prev) => ({
      ...prev,
      dstWarehouseId: id,
      dstZone: "",
      dstLocationId: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.dstWarehouseId;
      return next;
    });
  }

  function setDstZone(zone: string) {
    setFormState((prev) => ({ ...prev, dstZone: zone, dstLocationId: "" }));
  }

  function setDstLocation(id: string) {
    setField("dstLocationId", id);
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.srcWarehouseId)
      e.srcWarehouseId = "Source warehouse is required.";
    if (!form.srcLocationId) e.srcLocationId = "Source location is required.";
    if (!form.dstWarehouseId)
      e.dstWarehouseId = "Destination warehouse is required.";
    if (!form.dstLocationId)
      e.dstLocationId = "Destination location is required.";
    if (!form.productId) e.productId = "Product is required.";
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0)
      e.quantity = "Quantity must be greater than 0.";
    return e;
  }

  const isFormValid =
    !!form.srcWarehouseId &&
    !!form.srcLocationId &&
    !!form.dstWarehouseId &&
    !!form.dstLocationId &&
    !!form.productId &&
    parseFloat(form.quantity) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    setServerError(undefined);
    try {
      const result = await transfer.mutateAsync({
        sourceWarehouseId: form.srcWarehouseId,
        sourceStockLocationId: form.srcLocationId,
        destinationWarehouseId: form.dstWarehouseId,
        destinationStockLocationId: form.dstLocationId,
        productId: form.productId,
        quantity: parseFloat(form.quantity),
        notes: form.notes || undefined,
      });
      const srcLocationCode =
        srcLocations.data?.find((l) => l.id === form.srcLocationId)
          ?.fullLocationCode ?? form.srcLocationId;
      const dstLocationCode =
        dstLocations.data?.find((l) => l.id === form.dstLocationId)
          ?.fullLocationCode ?? form.dstLocationId;
      setSuccess({ result, srcLocationCode, dstLocationCode });
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

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
              setFormState(INITIAL);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        {/* Source */}
        <div className="flex flex-col gap-4 rounded-lg border border-surface-border p-4">
          <LocationCascade
            heading="Source"
            prefix="src-"
            warehouseId={form.srcWarehouseId}
            onWarehouseChange={setSrcWarehouse}
            zone={form.srcZone}
            onZoneChange={setSrcZone}
            locationId={form.srcLocationId}
            onLocationChange={setSrcLocation}
            warehouseError={errors.srcWarehouseId}
            locationError={errors.srcLocationId}
          />
        </div>

        {/* Product + quantity */}
        <div className="flex flex-col gap-4">
          <ProductSelector
            value={form.productId}
            onChange={(id) => setField("productId", id)}
            error={errors.productId}
          />

          <div>
            <label className="input-label" htmlFor="xfer-quantity">
              Quantity
            </label>
            <input
              id="xfer-quantity"
              type="number"
              min="0"
              step="any"
              className={`input${errors.quantity ? " input-error" : ""}`}
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
            />
            {errors.quantity && (
              <p className="input-error-msg">{errors.quantity}</p>
            )}
            <div className="mt-1">
              <LiveStockDisplay
                productId={form.productId}
                warehouseId={form.srcWarehouseId}
                locationId={form.srcLocationId}
                enteredQuantity={parseFloat(form.quantity) || 0}
              />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-4 rounded-lg border border-surface-border p-4">
          <LocationCascade
            heading="Destination"
            prefix="dst-"
            warehouseId={form.dstWarehouseId}
            onWarehouseChange={setDstWarehouse}
            zone={form.dstZone}
            onZoneChange={setDstZone}
            locationId={form.dstLocationId}
            onLocationChange={setDstLocation}
            warehouseError={errors.dstWarehouseId}
            locationError={errors.dstLocationId}
          />
        </div>

        <div>
          <label className="input-label" htmlFor="xfer-notes">
            Notes{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            id="xfer-notes"
            type="text"
            className="input"
            placeholder="Any additional information…"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
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
            disabled={!isFormValid || isSubmitting}
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
