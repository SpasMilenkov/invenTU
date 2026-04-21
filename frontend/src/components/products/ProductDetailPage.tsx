import { useState } from 'react';
import QueryProvider from '../providers/QueryProvider';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import {
  useArchiveProduct,
  useProduct,
  useStockSummary,
} from '../../lib/hooks/useProducts';
import { deriveStockStatus, type ProductDto } from '../../lib/types/products';
import ProductFormDrawer from './ProductFormDrawer';
import ArchiveConfirm from './ArchiveConfirm';

const CAN_MANAGE_ROLES = ['Admin', 'Manager'];

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.valueOf()) ? '—' : d.toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
      <div className="h-32 w-full animate-pulse rounded-[1.25rem] bg-surface-alt" />
      <div className="h-48 w-full animate-pulse rounded-[1.25rem] bg-surface-alt" />
    </div>
  );
}

function StockStatusPill({ product }: { product: ProductDto }) {
  const stock = useStockSummary(product.id);
  if (stock.isLoading) {
    return <div className="h-4 w-24 animate-pulse rounded bg-surface-alt" />;
  }
  if (stock.isError || !stock.data) {
    return <span className="text-text-muted">Stock unavailable</span>;
  }
  const status = deriveStockStatus(stock.data.totalQuantityAvailable, product.minStockLevel);
  const cls =
    status === 'OutOfStock'
      ? 'badge badge-danger'
      : status === 'LowStock'
      ? 'badge badge-warning'
      : 'badge badge-success';
  const label =
    status === 'OutOfStock' ? 'Out of stock' : status === 'LowStock' ? 'Low stock' : 'In stock';
  return <span className={cls}>{label}</span>;
}

function StockBreakdown({ productId }: { productId: string }) {
  const stock = useStockSummary(productId);
  if (stock.isLoading) {
    return <div className="h-24 w-full animate-pulse rounded-[1.25rem] bg-surface-alt" />;
  }
  if (stock.isError || !stock.data) {
    return (
      <div className="rounded-[1.25rem] border border-surface-border bg-surface p-6 text-sm text-text-muted dark:border-secondary-700 dark:bg-secondary-800">
        Stock information is not available right now.
      </div>
    );
  }
  const s = stock.data;
  return (
    <div className="rounded-[1.25rem] border border-surface-border bg-surface shadow-card dark:border-secondary-700 dark:bg-secondary-800">
      <div className="grid grid-cols-3 gap-6 border-b border-surface-border px-6 py-4 dark:border-secondary-700">
        <InfoRow label="Available" value={<span className="text-lg font-semibold">{s.totalQuantityAvailable}</span>} />
        <InfoRow label="Reserved" value={<span className="text-lg font-semibold">{s.totalQuantityReserved}</span>} />
        <InfoRow label="On hand" value={<span className="text-lg font-semibold">{s.totalQuantity}</span>} />
      </div>
      {s.byWarehouse.length === 0 ? (
        <p className="px-6 py-6 text-sm text-text-muted">No stock recorded in any warehouse yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-surface-alt text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-muted dark:bg-secondary-900/60">
            <tr>
              <th className="px-6 py-3 text-left">Warehouse</th>
              <th className="px-6 py-3 text-right">Available</th>
              <th className="px-6 py-3 text-right">Reserved</th>
              <th className="px-6 py-3 text-right">On hand</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border dark:divide-secondary-700">
            {s.byWarehouse.map((w) => (
              <tr key={w.warehouseId}>
                <td className="px-6 py-3 text-text-primary">{w.warehouseName}</td>
                <td className="px-6 py-3 text-right">{w.totalQuantityAvailable}</td>
                <td className="px-6 py-3 text-right">{w.totalQuantityReserved}</td>
                <td className="px-6 py-3 text-right">{w.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductDetailInner({ productId }: { productId: string }) {
  const { data: me } = useCurrentUser();
  const canManage = me?.roles?.some((r) => CAN_MANAGE_ROLES.includes(r)) ?? false;

  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const archive = useArchiveProduct();

  const [editOpen, setEditOpen] = useState(false);
  const [archivingOpen, setArchivingOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | undefined>(undefined);

  async function confirmArchive() {
    if (!product) return;
    setArchiveError(undefined);
    try {
      await archive.mutateAsync(product.id);
      setArchivingOpen(false);
      window.location.assign('/products');
    } catch (err) {
      setArchiveError(extractAuthErrorMessage(err));
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-xl rounded-md border border-danger-200 bg-danger-50 p-6 text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
        <p>Could not load the product. It may have been archived or the link is broken.</p>
        <div className="mt-3 flex gap-2">
          <a href="/products" className="btn btn-outline btn-sm">Back to products</a>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <a href="/products" className="text-sm text-text-muted hover:text-text-primary">
          ← Back to products
        </a>
      </div>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-xs text-text-muted">{product.sku}</p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-text-primary">
            {product.name}
            {!product.isActive && <span className="badge badge-neutral">Archived</span>}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-text-muted">
            <span>{product.categoryName}</span>
            <span aria-hidden>·</span>
            <StockStatusPill product={product} />
          </div>
        </div>
        {canManage && product.isActive && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
              onClick={() => {
                setArchiveError(undefined);
                setArchivingOpen(true);
              }}
            >
              Archive
            </button>
          </div>
        )}
      </header>

      <section className="rounded-[1.25rem] border border-surface-border bg-surface p-6 shadow-card dark:border-secondary-700 dark:bg-secondary-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <InfoRow label="Unit price" value={formatCurrency(product.unitPrice)} />
          <InfoRow label="Cost price" value={formatCurrency(product.costPrice)} />
          <InfoRow label="Unit of measure" value={product.unitOfMeasure} />
          <InfoRow label="Min stock" value={product.minStockLevel} />
          <InfoRow label="Max stock" value={product.maxStockLevel ?? '—'} />
          <InfoRow label="Reorder point" value={product.reorderPoint} />
          <InfoRow label="Barcode" value={product.barcode ?? '—'} />
          <InfoRow label="Created" value={formatDate(product.createdAt)} />
          <InfoRow label="Updated" value={formatDate(product.updatedAt)} />
        </div>
        {product.description && (
          <div className="mt-6 border-t border-surface-border pt-4 dark:border-secondary-700">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Description</p>
            <p className="mt-1 whitespace-pre-line text-sm text-text-primary">{product.description}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Stock by warehouse</h2>
        <StockBreakdown productId={product.id} />
      </section>

      {editOpen && (
        <ProductFormDrawer
          product={product}
          onClose={() => setEditOpen(false)}
          onSuccess={() => setEditOpen(false)}
        />
      )}

      {archivingOpen && (
        <ArchiveConfirm
          product={product}
          isPending={archive.isPending}
          errorMessage={archiveError}
          onConfirm={confirmArchive}
          onClose={() => {
            if (!archive.isPending) setArchivingOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface Props {
  productId: string | undefined;
}

export default function ProductDetailPage({ productId }: Props) {
  if (!productId) {
    return (
      <div className="mx-auto max-w-xl rounded-md border border-danger-200 bg-danger-50 p-6 text-sm text-danger-700 dark:border-danger-900/60 dark:bg-danger-950/40 dark:text-danger-300">
        Missing product id in URL.
      </div>
    );
  }
  return (
    <QueryProvider>
      <ProductDetailInner productId={productId} />
    </QueryProvider>
  );
}
