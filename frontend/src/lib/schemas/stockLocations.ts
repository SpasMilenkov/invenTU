import { z } from 'zod';

export const LOCATION_SEGMENT_REGEX = /^[A-Za-z0-9\-_]+$/;

const optionalSegment = z
  .string()
  .max(50, 'Max 50 characters')
  .regex(LOCATION_SEGMENT_REGEX, 'Letters, numbers, hyphens, underscores only')
  .optional()
  .or(z.literal(''));

export const createStockLocationSchema = z.object({
  zone: z
    .string()
    .min(1, 'Zone is required')
    .max(50, 'Max 50 characters')
    .regex(LOCATION_SEGMENT_REGEX, 'Letters, numbers, hyphens, underscores only'),
  aisle: optionalSegment,
  shelf: optionalSegment,
  bin: optionalSegment,
  maxCapacity: z
    .number({ message: 'Must be a number' })
    .int('Must be a whole number')
    .positive('Must be greater than 0'),
});

export type CreateStockLocationInput = z.infer<typeof createStockLocationSchema>;

export const updateStockLocationSchema = createStockLocationSchema;
export type UpdateStockLocationInput = z.infer<typeof updateStockLocationSchema>;
