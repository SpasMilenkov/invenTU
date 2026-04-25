import { useState } from "react";
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

interface FormState {
  warehouseId: string;
  zone: string;
  stockLocationId: string;
  productId: string;
  quantity: string;
  reasonCode: string;
  notes: string;
}

const INITIAL: FormState = {
  warehouseId: "",
  zone: "",
  stockLocationId: "",
  productId: "",
  quantity: "",
  reasonCode: "",
  notes: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

interface SuccessInfo {
  result: StockIssueResult;
  locationCode: string;
}

function StockIssueForm() {
  const [form, setFormState] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | undefined>();
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locations = useStockLocations(form.warehouseId || null);
  const issue = useIssueStock();

  function setField(field: keyof FormState, value: string) {
    if (field === "warehouseId") {
      setFormState((prev) => ({
        ...prev,
        warehouseId: value,
        zone: "",
        stockLocationId: "",
      }));
    } else if (field === "zone") {
      setFormState((prev) => ({ ...prev, zone: value, stockLocationId: "" }));
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }));
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.warehouseId) e.warehouseId = "Warehouse is required.";
    if (!form.stockLocationId) e.stockLocationId = "Location is required.";
    if (!form.productId) e.productId = "Product is required.";
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0)
      e.quantity = "Quantity must be greater than 0.";
    if (!form.reasonCode.trim()) e.reasonCode = "Reason code is required.";
    return e;
  }

  const isFormValid =
    !!form.warehouseId &&
    !!form.stockLocationId &&
    !!form.productId &&
    parseFloat(form.quantity) > 0 &&
    !!form.reasonCode.trim();

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
      const result = await issue.mutateAsync({
        warehouseId: form.warehouseId,
        stockLocationId: form.stockLocationId,
        productId: form.productId,
        quantity: parseFloat(form.quantity),
        reasonCode: form.reasonCode,
        notes: form.notes || undefined,
      });
      const locationCode =
        locations.data?.find((l) => l.id === form.stockLocationId)
          ?.fullLocationCode ?? form.stockLocationId;
      setSuccess({ result, locationCode });
    } catch (err) {
      setServerError(extractAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

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
              setFormState(INITIAL);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <LocationCascade
          warehouseId={form.warehouseId}
          onWarehouseChange={(id) => setField("warehouseId", id)}
          zone={form.zone}
          onZoneChange={(z) => setField("zone", z)}
          locationId={form.stockLocationId}
          onLocationChange={(id) => setField("stockLocationId", id)}
          warehouseError={errors.warehouseId}
          locationError={errors.stockLocationId}
        />

        <ProductSelector
          value={form.productId}
          onChange={(id) => setField("productId", id)}
          error={errors.productId}
        />

        <div>
          <label className="input-label" htmlFor="issue-quantity">
            Quantity
          </label>
          <input
            id="issue-quantity"
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
              warehouseId={form.warehouseId}
              locationId={form.stockLocationId}
              enteredQuantity={parseFloat(form.quantity) || 0}
            />
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="issue-reason">
            Reason code
          </label>
          <input
            id="issue-reason"
            type="text"
            maxLength={100}
            className={`input${errors.reasonCode ? " input-error" : ""}`}
            placeholder="e.g. Order #12345, Damaged goods, Sample"
            value={form.reasonCode}
            onChange={(e) => setField("reasonCode", e.target.value)}
          />
          {errors.reasonCode && (
            <p className="input-error-msg">{errors.reasonCode}</p>
          )}
        </div>

        <div>
          <label className="input-label" htmlFor="issue-notes">
            Notes{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            id="issue-notes"
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
