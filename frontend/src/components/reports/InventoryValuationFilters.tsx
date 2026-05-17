import { useWarehousesList } from '../../lib/hooks/useWarehouses';
import { useCategoriesFlat } from '../../lib/hooks/useCategories';
import type { InventoryValuationFilters as Filters } from '../../lib/types/reports';

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export default function InventoryValuationFilters({ value, onChange }: Props) {
  const warehouses = useWarehousesList({ page: 1, pageSize: 200, status: 'Active' });
  const categories = useCategoriesFlat();

  return (
    <div className="toolbar">
      <div className="md:w-72">
        <label className="input-label" htmlFor="iv-warehouse">Warehouse</label>
        <select
          id="iv-warehouse"
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

      <div className="md:w-72">
        <label className="input-label" htmlFor="iv-category">Category</label>
        <select
          id="iv-category"
          className="select"
          value={value.categoryId ?? ''}
          disabled={categories.isLoading}
          onChange={(e) =>
            onChange({ ...value, categoryId: e.target.value === '' ? undefined : e.target.value })
          }
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.path}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
