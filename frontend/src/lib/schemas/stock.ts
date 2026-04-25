import { z } from "zod";

const positiveQuantity = z.string().refine(
  (v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0;
  },
  { message: "Quantity must be greater than 0." },
);

export const receiveStockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required."),
  zone: z.string(),
  stockLocationId: z.string().min(1, "Location is required."),
  productId: z.string().min(1, "Product is required."),
  quantity: positiveQuantity,
  referenceNumber: z.string(),
  notes: z.string(),
});

export const issueStockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required."),
  zone: z.string(),
  stockLocationId: z.string().min(1, "Location is required."),
  productId: z.string().min(1, "Product is required."),
  quantity: positiveQuantity,
  reasonCode: z.string().min(1, "Reason code is required."),
  notes: z.string(),
});

export const transferStockSchema = z.object({
  srcWarehouseId: z.string().min(1, "Source warehouse is required."),
  srcZone: z.string(),
  srcLocationId: z.string().min(1, "Source location is required."),
  dstWarehouseId: z.string().min(1, "Destination warehouse is required."),
  dstZone: z.string(),
  dstLocationId: z.string().min(1, "Destination location is required."),
  productId: z.string().min(1, "Product is required."),
  quantity: positiveQuantity,
  notes: z.string(),
});
