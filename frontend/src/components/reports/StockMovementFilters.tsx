import { useState } from 'react';
import { useWarehousesList } from '../../lib/hooks/useWarehouses';
import { useProductsList } from '../../lib/hooks/useProducts';
import {
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_STATUS_OPTIONS,
  type StockMovementFilters as Filters,
  type MovementStatusFilter,
  type MovementTypeFilter,
} from '../../lib/types/reports';

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export default function StockMovementFilters({ value, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);
  const warehouses = useWarehousesList({ page: 1, pageSize: 200, status: 'Active' });
  const products = useProductsList({ page: 1, pageSize: 200 });

  return (
    <div className="flex flex-col gap-3">
      <div className="toolbar">
        <div>
          <label className="input-label" htmlFor="sm-from">From</label>
          <input
            id="sm-from"
            type="date"
            className="input"
            value={value.fromDate ?? ''}
            onChange={(e) =>
              onChange({ ...value, fromDate: e.target.value === '' ? undefined : e.target.value })
            }
          />
        </div>
        <div>
          <label className="input-label" htmlFor="sm-to">To</label>
          <input
            id="sm-to"
            type="date"
            className="input"
            value={value.toDate ?? ''}
            onChange={(e) =>
              onChange({ ...value, toDate: e.target.value === '' ? undefined : e.target.value })
            }
          />
        </div>
        <div className="md:w-72">
          <label className="input-label" htmlFor="sm-warehouse">Warehouse</label>
          <select
            id="sm-warehouse"
            className="select"
            value={value.warehouseId ?? ''}
            disabled={warehouses.isLoading}
            onChange={(e) =>
              onChange({ ...value, warehouseId: e.target.value === '' ? undefined : e.target.value })
            }
          >
            <option value="">All warehouses</option>
            {warehouses.data?.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
        >
          {showMore ? 'Hide filters' : 'More filters'}
        </button>
      </div>

      {showMore && (
        <div className="toolbar">
          <div className="md:w-56">
            <label className="input-label" htmlFor="sm-type">Type</label>
            <select
              id="sm-type"
              className="select"
              value={value.movementType ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  movementType:
                    e.target.value === '' ? undefined : (e.target.value as MovementTypeFilter),
                })
              }
            >
              <option value="">All types</option>
              {MOVEMENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="md:w-56">
            <label className="input-label" htmlFor="sm-status">Status</label>
            <select
              id="sm-status"
              className="select"
              value={value.status ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  status:
                    e.target.value === '' ? undefined : (e.target.value as MovementStatusFilter),
                })
              }
            >
              <option value="">All statuses</option>
              {MOVEMENT_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:w-72">
            <label className="input-label" htmlFor="sm-product">Product</label>
            <select
              id="sm-product"
              className="select"
              value={value.productId ?? ''}
              disabled={products.isLoading}
              onChange={(e) =>
                onChange({ ...value, productId: e.target.value === '' ? undefined : e.target.value })
              }
            >
              <option value="">All products</option>
              {products.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
