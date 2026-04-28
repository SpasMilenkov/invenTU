// src/components/dashboard/StockByCategory.tsx

import type { StockByCategory } from "../../lib/types/dashboard";

interface Props {
  items: StockByCategory[];
}

// Cycles through accent colours for the bars so each category feels distinct.
// All colours are pulled from existing CSS tokens — no hard-coded hex values.
const BAR_COLORS = [
  "var(--color-accent)",
  "var(--color-ok)",
  "var(--color-info)",
  "var(--color-warn)",
  "var(--color-crit)",
];

export default function StockByCategoryChart({ items }: Props) {
  // Sort descending so the longest bar is always on top — easier to scan.
  const sorted = [...items].sort((a, b) => b.totalQuantity - a.totalQuantity);
  const max = Math.max(...sorted.map((i) => i.totalQuantity), 1);

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Stock by Category</span>
        <span className="micro" style={{ color: "var(--color-ink-4)" }}>
          Units on hand
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="empty" style={{ margin: 16 }}>
          No category data available yet
        </div>
      ) : (
        <div className="panel-body flex flex-col gap-5">
          {sorted.map((item, i) => {
            const pct = Math.round((item.totalQuantity / max) * 100);
            const barColor = BAR_COLORS[i % BAR_COLORS.length];

            return (
              <div key={item.categoryId} className="flex flex-col gap-1.5">
                {/* Label row */}
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "var(--color-ink-2)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "65%",
                    }}
                  >
                    {item.categoryName}
                  </span>
                  <span
                    className="mono tnum"
                    style={{
                      fontSize: "12px",
                      color: "var(--color-ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    {item.totalQuantity.toLocaleString()} units
                  </span>
                </div>

                {/* Bar */}
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: barColor,
                      transition: "width 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
