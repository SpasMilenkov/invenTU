import { z } from "zod";

const SKU_PATTERN = /^[A-Za-z0-9\-_.]+$/;
const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

const baseObject = z.object({
  name: z.string().min(1, "Name is required").max(200, "Max 200 characters"),
  categoryId: z
    .string()
    .min(1, "Category is required")
    .regex(UUID_PATTERN, "Invalid category"),
  primaryWarehouseId: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || UUID_PATTERN.test(v), {
      message: "Invalid warehouse",
    }),
  unitPrice: z
    .number({ message: "Unit price is required" })
    .gt(0, "Must be greater than 0"),
  costPrice: z
    .number({ message: "Cost price is required" })
    .gte(0, "Must be 0 or greater"),
  unitOfMeasure: z
    .string()
    .min(1, "Unit of measure is required")
    .max(20, "Max 20 characters"),
  isActive: z.boolean(),
  description: z.string().max(2000, "Max 2000 characters").optional(),
  barcode: z.string().max(100, "Max 100 characters").optional(),
  minStockLevel: z
    .number()
    .int("Must be a whole number")
    .gte(0, "Must be 0 or greater"),
  maxStockLevel: z
    .number()
    .int("Must be a whole number")
    .gte(0, "Must be 0 or greater")
    .nullish(),
  reorderPoint: z
    .number()
    .int("Must be a whole number")
    .gte(0, "Must be 0 or greater"),
});

const stockRefine = (data: {
  minStockLevel: number;
  maxStockLevel?: number | null;
}) => data.maxStockLevel == null || data.maxStockLevel >= data.minStockLevel;

const reorderRefine = (data: { reorderPoint: number; minStockLevel: number }) =>
  data.reorderPoint >= data.minStockLevel;

export const createProductSchema = baseObject
  .extend({
    sku: z
      .string()
      .min(1, "SKU is required")
      .max(50, "Max 50 characters")
      .regex(SKU_PATTERN, "Only letters, numbers, -, _, ."),
  })
  .refine(stockRefine, {
    message: "Max stock must be ≥ min stock",
    path: ["maxStockLevel"],
  })
  .refine(reorderRefine, {
    message: "Reorder point must be ≥ min stock",
    path: ["reorderPoint"],
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = baseObject
  .refine(stockRefine, {
    message: "Max stock must be ≥ min stock",
    path: ["maxStockLevel"],
  })
  .refine(reorderRefine, {
    message: "Reorder point must be ≥ min stock",
    path: ["reorderPoint"],
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export function normalizeUpdatePayload(
  values: UpdateProductInput,
): UpdateProductInput {
  return {
    ...values,
    primaryWarehouseId:
      values.primaryWarehouseId === "" ? undefined : values.primaryWarehouseId,
    description: values.description === "" ? undefined : values.description,
    barcode: values.barcode === "" ? undefined : values.barcode,
  };
}
