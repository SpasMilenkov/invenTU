import type { ReactNode } from "react";
import LocationCascade from "./LocationCascade";

interface LocationPanelProps {
  /** Visual variant — colors the left edge of the head. */
  variant?: "default" | "src" | "dst";
  /** Mono caption shown in the panel head, e.g. "FROM" / "TO" / "WHERE". */
  caption: string;
  /** Optional right-side hint shown in mono (e.g. selected location code). */
  hint?: ReactNode;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  zone: string;
  onZoneChange: (zone: string) => void;
  locationId: string;
  onLocationChange: (id: string) => void;
  warehouseError?: string;
  locationError?: string;
  prefix?: string;
  warehouseTestId?: string;
  locationTestId?: string;
}

export default function LocationPanel({
  variant = "default",
  caption,
  hint,
  ...cascadeProps
}: LocationPanelProps) {
  return (
    <div className={`location-panel${variant !== "default" ? ` ${variant}` : ""}`}>
      <div className="location-panel-head">
        <span className="micro">{caption}</span>
        {hint && <span className="sku">{hint}</span>}
      </div>
      <div className="location-panel-body">
        <LocationCascade {...cascadeProps} />
      </div>
    </div>
  );
}
