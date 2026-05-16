import { keepPreviousData, useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import type { AuditLogDto, AuditLogListParams } from '../types/auditLogs';

export const AUDIT_LOGS_QUERY_KEY = ['audit-logs'] as const;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function buildParams(params: AuditLogListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    page: params.page,
    pageSize: params.pageSize,
  };
  if (params.entityType) out.entityType = params.entityType;
  if (params.action) out.action = params.action;
  if (params.userId) out.userId = params.userId;
  if (params.fromDate) out.fromDate = params.fromDate;
  if (params.toDate) out.toDate = params.toDate;
  return out;
}

export function useAuditLogsList(params: AuditLogListParams) {
  return useQuery<PagedResult<AuditLogDto>>({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<AuditLogDto>>('/audit-logs', {
        params: buildParams(params),
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
  });
}
