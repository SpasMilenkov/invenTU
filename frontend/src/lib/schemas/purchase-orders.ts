import { z } from 'zod';

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

const purchaseOrderLineSchema = z.object({
  productId: z.string().regex(UUID_PATTERN, 'Pick a product'),
  quantity: z.number({ message: 'Quantity required' }).gt(0, 'Must be greater than 0'),
  unitPrice: z.number({ message: 'Unit price required' }).gte(0, 'Must be 0 or greater'),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().regex(UUID_PATTERN, 'Pick a supplier'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDate: z.string().optional().or(z.literal('')),
  purchaseOrderLines: z.array(purchaseOrderLineSchema).min(1, 'Add at least one line'),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type CreatePurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;
