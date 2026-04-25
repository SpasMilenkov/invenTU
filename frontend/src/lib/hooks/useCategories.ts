import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { categorySchema, type CategoryDto } from '../schemas/categories';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

export interface FlatCategory {
  id: string;
  name: string;
  path: string;
  depth: number;
  description: string | null;
  parentId: string | null;
}

export function useCategoriesTree() {
  return useQuery<CategoryDto[]>({
    queryKey: [...CATEGORIES_QUERY_KEY, 'tree'],
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/categories');
      return categorySchema.array().parse(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

function flatten(roots: CategoryDto[]): FlatCategory[] {
  const out: FlatCategory[] = [];
  const visit = (node: CategoryDto, parents: string[]) => {
    const path = parents.length === 0 ? node.name : `${parents.join(' / ')} / ${node.name}`;
    out.push({
      id: node.id,
      name: node.name,
      path,
      depth: parents.length,
      description: node.description,
      parentId: node.parentCategoryId,
    });
    for (const child of node.subCategories) {
      visit(child, [...parents, node.name]);
    }
  };
  for (const root of roots) visit(root, []);
  return out;
}

export function useCategoriesFlat() {
  const query = useCategoriesTree();
  const data = useMemo(() => flatten(query.data ?? []), [query.data]);
  return { ...query, data };
}
