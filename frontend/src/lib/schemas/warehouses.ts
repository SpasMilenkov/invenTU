import { z } from 'zod';

export const WAREHOUSE_CODE_REGEX = /^[A-Za-z0-9\-_]+$/;

export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Max 20 characters')
    .regex(WAREHOUSE_CODE_REGEX, 'Letters, numbers, hyphens, underscores only'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Max 200 characters'),
  location: z
    .string()
    .max(500, 'Max 500 characters')
    .optional()
    .or(z.literal('')),
  maxStockLevel: z
    .number({ message: 'Must be a number' })
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .optional(),
  isActive: z.boolean().default(true),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export const updateWarehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Max 200 characters'),
  location: z
    .string()
    .max(500, 'Max 500 characters')
    .optional()
    .or(z.literal('')),
  maxStockLevel: z
    .number({ message: 'Must be a number' })
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .optional(),
});

export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
