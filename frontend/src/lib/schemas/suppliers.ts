import { z } from 'zod';

const PHONE_PATTERN = /^\+?(\d{1,3})?[-.\s]?(\(?\d{3}\)?[-.\s]?)?(\d[-.\s]?){6,9}\d$/;

const baseObject = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Max 200 characters'),
  contactEmail: z
    .string()
    .max(200, 'Max 200 characters')
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  contactPhone: z
    .string()
    .regex(PHONE_PATTERN, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const createSupplierSchema = baseObject;
export const updateSupplierSchema = baseObject;

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export function normalizeSupplierPayload<T extends CreateSupplierInput>(values: T): T {
  return {
    ...values,
    name: values.name.trim(),
    contactEmail: values.contactEmail === '' ? undefined : values.contactEmail,
    contactPhone: values.contactPhone === '' ? undefined : values.contactPhone,
    address: values.address === '' ? undefined : values.address?.trim(),
  };
}
