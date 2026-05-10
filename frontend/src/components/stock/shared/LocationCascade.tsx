import { useMemo } from "react";
import {
  useActiveWarehouses,
  useStockLocations,
} from "../../../lib/hooks/useReferenceData";

interface LocationCascadeProps {
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  zone: string;
  onZoneChange: (zone: string) => void;
  locationId: string;
  onLocationChange: (id: string) => void;
  warehouseError?: string;
  locationError?: string;
  /** DOM id prefix to avoid duplicate ids when rendered twice on a page */
  prefix?: string;
  /** Optional section heading rendered above the fields */
  heading?: string;
  warehouseTestId?: string;
  locationTestId?: string;
}

export default function LocationCascade({
  warehouseId,
  onWarehouseChange,
  zone,
  onZoneChange,
  locationId,
  onLocationChange,
  warehouseError,
  locationError,
  prefix = "",
  heading,
  warehouseTestId,
  locationTestId,
}: LocationCascadeProps) {
  const warehouses = useActiveWarehouses();
  const locations = useStockLocations(warehouseId || null);

  const zones = useMemo(() => {
    if (!locations.data) return [];
    return [...new Set(locations.data.map((l) => l.zone))].sort();
  }, [locations.data]);

  const filteredLocations = useMemo(() => {
    if (!locations.data) return [];
    return zone
      ? locations.data.filter((l) => l.zone === zone)
      : locations.data;
  }, [locations.data, zone]);

  return (
    <div className="flex flex-col gap-4">
      {heading && (
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {heading}
        </p>
      )}

      {/* Warehouse */}
      <div>
        <label className="input-label" htmlFor={`${prefix}warehouseId`}>
          Warehouse
        </label>
        <select
          id={`${prefix}warehouseId`}
          data-testid={warehouseTestId}
          className={`select${warehouseError ? " input-error" : ""}`}
          value={warehouseId}
          onChange={(e) => {
            onWarehouseChange(e.target.value);
            onZoneChange("");
            onLocationChange("");
          }}
        >
          <option value="">Select warehouse…</option>
          {warehouses.data?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.code})
            </option>
          ))}
        </select>
        {warehouseError && <p className="input-error-msg">{warehouseError}</p>}
      </div>

      {/* Zone — only shown when the warehouse has more than one zone */}
      {warehouseId && zones.length > 1 && (
        <div>
          <label className="input-label" htmlFor={`${prefix}zone`}>
            Zone
          </label>
          <select
            id={`${prefix}zone`}
            className="select"
            value={zone}
            onChange={(e) => {
              onZoneChange(e.target.value);
              onLocationChange("");
            }}
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location */}
      <div>
        <label className="input-label" htmlFor={`${prefix}locationId`}>
          Location
        </label>
        <select
          id={`${prefix}locationId`}
          data-testid={locationTestId}
          className={`select${locationError ? " input-error" : ""}`}
          value={locationId}
          disabled={!warehouseId}
          onChange={(e) => onLocationChange(e.target.value)}
        >
          <option value="">Select location…</option>
          {filteredLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.fullLocationCode}
            </option>
          ))}
        </select>
        {locationError && <p className="input-error-msg">{locationError}</p>}
      </div>
    </div>
  );
}
