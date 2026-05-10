import { z } from 'zod';

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

export type CategoryDto = {
  id: string;
  name: string;
  description: string | null;
  parentCategoryId: string | null;
  subCategories: CategoryDto[];
  products: unknown[];
};

export const categorySchema: z.ZodType<CategoryDto> = z.object({
  id: z.string().regex(UUID_PATTERN),
  name: z.string().min(1),
  description: z.string().nullable(),
  parentCategoryId: z.string().regex(UUID_PATTERN).nullable(),
  subCategories: z.lazy(() => z.array(categorySchema)),
  products: z.array(z.unknown()).transform(() => []),
});

export const createCategorySchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .nullable()
    .optional(),
  parentCategoryId: z.string().regex(UUID_PATTERN).nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .nullable()
    .optional(),
  parentCategoryId: z.string().regex(UUID_PATTERN).nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
