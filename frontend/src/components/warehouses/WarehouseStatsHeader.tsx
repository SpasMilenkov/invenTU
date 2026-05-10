import type { WarehouseSummary } from '../../lib/hooks/useWarehouses';
import { Tag } from '../ui/Tag';
import CapacityBar from './CapacityBar';
import { formatCompactNumber } from '../../lib/format';

interface Props {
  warehouse: WarehouseSummary;
}

export default function WarehouseStatsHeader({ warehouse }: Props) {
  return (
    <div className="wh-stats-header">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="wh-stats-code-label">Code</span>
          <span className="wh-stats-code">{warehouse.code}</span>
        </div>
        {warehouse.isActive
          ? <Tag kind="ok">ACTIVE</Tag>
          : <Tag kind="neutral">INACTIVE</Tag>
        }
      </div>

      <div className="wh-stats-divider my-2" />

      <div className="flex items-center gap-2 mb-2">
        <span className="wh-stat-label">Locations</span>
        <span className="wh-stat-value">{warehouse.totalLocations.toLocaleString()}</span>
        <span className="wh-stat-sep">·</span>
        <span className="wh-stat-label">SKUs</span>
        <span className="wh-stat-value">{warehouse.totalStockItems.toLocaleString()}</span>
        <span className="wh-stat-sep">·</span>
        <span className="wh-stat-label">Qty</span>
        <span className="wh-stat-value">{formatCompactNumber(warehouse.totalQuantity)}</span>
      </div>

      <CapacityBar used={warehouse.totalStockItems} max={warehouse.maxStockLevel} />
    </div>
  );
}
