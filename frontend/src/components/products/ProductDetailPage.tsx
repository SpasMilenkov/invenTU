import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import QueryProvider from '../providers/QueryProvider';
import { useCurrentUser } from '../../lib/auth/useCurrentUser';
import { extractAuthErrorMessage } from '../../lib/auth/errors';
import {
  useArchiveProduct,
  useProduct,
  useRestoreProduct,
  useStockSummary,
} from '../../lib/hooks/useProducts';
import { useWarehousesList } from '../../lib/hooks/useWarehouses';
import { deriveStockStatus, type ProductDto } from '../../lib/types/products';
import { PageHeader } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { Tag } from '../ui/Tag';
import { ConfirmModal } from '../ui/ConfirmModal';
import ProductFormDrawer from './ProductFormDrawer';

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
    <div className="flex flex-col gap-1">
      <span className="input-label">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div
        className="h-8 w-64 animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
      />
      <div
        className="h-32 w-full animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
      />
      <div
        className="h-48 w-full animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
      />
    </div>
  );
}

function StockStatusPill({ product }: { product: ProductDto }) {
  const stock = useStockSummary(product.id);
  if (stock.isLoading) {
    return (
      <div
        className="h-3 w-16 animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
      />
    );
  }
  if (stock.isError || !stock.data) {
    return <span style={{ color: 'var(--color-ink-3)' }}>Stock unavailable</span>;
  }
  const status = deriveStockStatus(stock.data.totalQuantityAvailable, product.minStockLevel);
  if (status === 'OutOfStock') return <Tag kind="crit">OUT OF STOCK</Tag>;
  if (status === 'LowStock') return <Tag kind="warn">LOW STOCK</Tag>;
  return <Tag kind="ok">IN STOCK</Tag>;
}

function StockBreakdown({ productId }: { productId: string }) {
  const stock = useStockSummary(productId);
  if (stock.isLoading) {
    return (
      <div
        className="h-24 w-full animate-pulse"
        style={{ background: 'var(--color-bg-sunk)' }}
      />
    );
  }
  if (stock.isError || !stock.data) {
    return (
      <p style={{ padding: '24px', color: 'var(--color-ink-3)', fontSize: 13 }}>
        Stock information is not available right now.
      </p>
    );
  }
  const s = stock.data;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <InfoRow
          label="Available"
          value={<span style={{ fontSize: 18, fontWeight: 600 }}>{s.totalQuantityAvailable}</span>}
        />
        <InfoRow
          label="Reserved"
          value={<span style={{ fontSize: 18, fontWeight: 600 }}>{s.totalQuantityReserved}</span>}
        />
        <InfoRow
          label="On hand"
          value={<span style={{ fontSize: 18, fontWeight: 600 }}>{s.totalQuantity}</span>}
        />
      </div>
      {s.byWarehouse.length === 0 ? (
        <p style={{ padding: '24px', color: 'var(--color-ink-3)', fontSize: 13 }}>
          No stock recorded in any warehouse yet.
        </p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th className="num">Available</th>
              <th className="num">Reserved</th>
              <th className="num">On hand</th>
            </tr>
          </thead>
          <tbody>
            {s.byWarehouse.map((w) => (
              <tr key={w.warehouseId}>
                <td className="strong">{w.warehouseName}</td>
                <td className="num">{w.quantityAvailable}</td>
                <td className="num">{w.quantityReserved}</td>
                <td className="num">{w.quantity}</td>
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
  const restore = useRestoreProduct();
  const warehouses = useWarehousesList({ page: 1, pageSize: 200, status: 'All' });

  const [editOpen, setEditOpen] = useState(false);
  const [archivingOpen, setArchivingOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | undefined>(undefined);
  const [restoringOpen, setRestoringOpen] = useState(false);
  const [restoreError, setRestoreError] = useState<string | undefined>(undefined);

  const closeEdit = useCallback(() => setEditOpen(false), []);

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

  async function confirmRestore() {
    if (!product) return;
    setRestoreError(undefined);
    try {
      await restore.mutateAsync(product.id);
      setRestoringOpen(false);
      toast.success('Product restored');
      await refetch();
    } catch (err) {
      setRestoreError(extractAuthErrorMessage(err));
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="info-card">
        <p>Could not load the product. It may have been archived or the link is broken.</p>
        <div className="mt-3 flex gap-2">
          <a href="/products" className="btn btn-outline btn-sm">
            Back to products
          </a>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isArchived = product.deletedAt !== null;

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <a href="/products" style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
          ← Back to products
        </a>
      </div>

      <PageHeader
        sub="OPERATE / PRODUCTS"
        title={
          <>
            {product.name}
            {isArchived && (
              <Tag kind="neutral" className="ml-3">
                ARCHIVED
              </Tag>
            )}
          </>
        }
        description={
          <>
            <span>SKU {product.sku}</span> <span aria-hidden>·</span>{' '}
            <span>{product.categoryName}</span> <span aria-hidden>·</span>{' '}
            <StockStatusPill product={product} />
          </>
        }
        actions={
          canManage ? (
            isArchived ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setRestoreError(undefined);
                  setRestoringOpen(true);
                }}
              >
                Restore
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: 'var(--color-crit)' }}
                  onClick={() => {
                    setArchiveError(undefined);
                    setArchivingOpen(true);
                  }}
                >
                  Archive
                </button>
              </>
            )
          ) : null
        }
      />

      <Panel title="Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <InfoRow label="Unit price" value={formatCurrency(product.unitPrice)} />
          <InfoRow label="Cost price" value={formatCurrency(product.costPrice)} />
          <InfoRow label="Unit of measure" value={product.unitOfMeasure} />
          <InfoRow
            label="Primary warehouse"
            value={
              !product.primaryWarehouseId
                ? '—'
                : warehouses.isLoading
                ? '…'
                : warehouses.data?.items.find((w) => w.id === product.primaryWarehouseId)?.name ?? '—'
            }
          />
          <InfoRow label="Min stock" value={product.minStockLevel} />
          <InfoRow label="Max stock" value={product.maxStockLevel ?? '—'} />
          <InfoRow label="Reorder point" value={product.reorderPoint} />
          <InfoRow label="Barcode" value={product.barcode ?? '—'} />
          <InfoRow label="Created" value={formatDate(product.createdAt)} />
          <InfoRow label="Updated" value={formatDate(product.updatedAt)} />
        </div>
        {product.description && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--color-rule)',
            }}
          >
            <p className="input-label">Description</p>
            <p
              className="mt-1 whitespace-pre-line"
              style={{ fontSize: 13, color: 'var(--color-ink)' }}
            >
              {product.description}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Stock by warehouse" flush>
        <StockBreakdown productId={product.id} />
      </Panel>

      {editOpen && (
        <ProductFormDrawer product={product} onClose={closeEdit} onSuccess={closeEdit} />
      )}

      {archivingOpen && (
        <ConfirmModal
          title={`Archive ${product.name}?`}
          body={
            <>
              The product will be hidden from most views. Archiving is blocked if any stock is
              still on hand — issue or transfer stock first.
            </>
          }
          confirmLabel="Archive"
          pendingLabel="Archiving…"
          isPending={archive.isPending}
          errorMessage={archiveError}
          variant="danger"
          onConfirm={confirmArchive}
          onClose={() => {
            if (!archive.isPending) setArchivingOpen(false);
          }}
        />
      )}

      {restoringOpen && (
        <ConfirmModal
          title={`Restore ${product.name}?`}
          body={
            <>
              The product will be visible again in normal product views and editable.
            </>
          }
          confirmLabel="Restore"
          pendingLabel="Restoring…"
          isPending={restore.isPending}
          errorMessage={restoreError}
          variant="primary"
          onConfirm={confirmRestore}
          onClose={() => {
            if (!restore.isPending) setRestoringOpen(false);
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
      <div className="info-card">Missing product id in URL.</div>
    );
  }
  return (
    <QueryProvider>
      <ProductDetailInner productId={productId} />
    </QueryProvider>
  );
}
