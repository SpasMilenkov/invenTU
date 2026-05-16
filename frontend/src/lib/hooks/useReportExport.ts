import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { downloadFile } from '../api';
import type { ReportEndpoints, ReportFormat } from '../types/reports';

export interface ExportArgs<TFilters> {
  endpoints: ReportEndpoints;
  filenameBase: string;
  filters: TFilters;
  format: ReportFormat;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim().length > 0) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) return message;
    }
    return err.message || 'Download failed';
  }
  if (err instanceof Error) return err.message;
  return 'Download failed';
}

export function useReportExport<TFilters extends Record<string, unknown>>() {
  return useMutation({
    mutationFn: async ({ endpoints, filenameBase, filters, format }: ExportArgs<TFilters>) => {
      const url = format === 'csv' ? endpoints.csv : endpoints.pdf;
      const fallbackName = `${filenameBase}.${format}`;
      await downloadFile(url, filters as Record<string, unknown>, fallbackName);
    },
    onSuccess: (_data, vars) => {
      toast.success(`${vars.format.toUpperCase()} downloaded`);
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });
}
