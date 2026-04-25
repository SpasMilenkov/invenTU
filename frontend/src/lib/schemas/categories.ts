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
