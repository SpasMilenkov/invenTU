import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import {
  categorySchema,
  type CategoryDto,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../schemas/categories';

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

export function updateNodeInTree(
  roots: CategoryDto[],
  id: string,
  patch: Partial<CategoryDto>,
): CategoryDto[] {
  return roots.map((node) => {
    if (node.id === id) {
      return { ...node, ...patch };
    }
    return { ...node, subCategories: updateNodeInTree(node.subCategories, id, patch) };
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryDto, unknown, CreateCategoryInput>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<CategoryDto>('/categories', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

interface UpdateCategoryVars {
  id: string;
  payload: UpdateCategoryInput;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, UpdateCategoryVars, { previous: CategoryDto[] | undefined }>({
    mutationFn: async ({ id, payload }) => {
      await apiClient.put('/categories/' + id, payload);
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [...CATEGORIES_QUERY_KEY, 'tree'] });
      const previous = queryClient.getQueryData<CategoryDto[]>([
        ...CATEGORIES_QUERY_KEY,
        'tree',
      ]);
      if (previous) {
        // Build a patch with only the keys the caller actually set, so that
        // an `undefined` field (meaning "no change") doesn't blank out the
        // cached node's existing value. `null` is preserved (means "cleared").
        const patch: Partial<CategoryDto> = {};
        if (payload.name !== undefined) patch.name = payload.name;
        if (payload.description !== undefined) patch.description = payload.description;
        if (payload.parentCategoryId !== undefined) {
          patch.parentCategoryId = payload.parentCategoryId;
        }
        queryClient.setQueryData(
          [...CATEGORIES_QUERY_KEY, 'tree'],
          updateNodeInTree(previous, id, patch),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([...CATEGORIES_QUERY_KEY, 'tree'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { id: string }>({
    mutationFn: async ({ id }) => {
      await apiClient.delete('/categories/' + id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
