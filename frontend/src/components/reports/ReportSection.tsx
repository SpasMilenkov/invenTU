import type { ReactNode } from 'react';
import Panel from '../ui/Panel';
import { useReportExport } from '../../lib/hooks/useReportExport';
import type { ReportEndpoints, ReportFormat } from '../../lib/types/reports';

interface ReportSectionProps<TFilters extends Record<string, unknown>> {
  title: string;
  description?: string;
  endpoints: ReportEndpoints;
  filenameBase: string;
  filters: TFilters;
  children: ReactNode;
}

export default function ReportSection<TFilters extends Record<string, unknown>>({
  title,
  description,
  endpoints,
  filenameBase,
  filters,
  children,
}: ReportSectionProps<TFilters>) {
  const exportMutation = useReportExport<TFilters>();
  const isPending = exportMutation.isPending;
  const activeFormat = exportMutation.variables?.format;

  const onDownload = (format: ReportFormat) => {
    exportMutation.mutate({ endpoints, filenameBase, filters, format });
  };

  return (
    <Panel
      title={title}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isPending}
            aria-busy={isPending && activeFormat === 'csv'}
            onClick={() => onDownload('csv')}
          >
            <Spinner show={isPending && activeFormat === 'csv'} />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isPending}
            aria-busy={isPending && activeFormat === 'pdf'}
            onClick={() => onDownload('pdf')}
          >
            <Spinner show={isPending && activeFormat === 'pdf'} />
            <span>Download PDF</span>
          </button>
        </div>
      }
    >
      {description && (
        <p className="mb-3 text-[12.5px]" style={{ color: 'var(--color-ink-3)' }}>
          {description}
        </p>
      )}
      {children}
    </Panel>
  );
}

function Spinner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
      aria-hidden
    />
  );
}
