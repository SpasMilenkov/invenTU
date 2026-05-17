import { useState, useEffect } from "react";
import { useProducts } from "../../../lib/hooks/useReferenceData";

interface ProductSelectorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (productId: string) => void;
  error?: string;
  selectTestId?: string;
}

export default function ProductSelector({
  id = "productId",
  label = "Product",
  value,
  onChange,
  error,
  selectTestId,
}: ProductSelectorProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const products = useProducts(debouncedSearch);

  return (
    <div>
      <label className="input-label" htmlFor={`${id}-search`}>
        {label}
      </label>
      <input
        id={`${id}-search`}
        type="text"
        className="input mb-1"
        placeholder="Search by name or SKU…"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <select
        id={id}
        data-testid={selectTestId}
        className={`select${error ? " input-error" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select product…</option>
        {products.data?.items.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.sku}
          </option>
        ))}
      </select>
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
}
