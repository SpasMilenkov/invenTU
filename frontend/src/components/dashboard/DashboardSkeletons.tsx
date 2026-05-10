// src/components/dashboard/DashboardSkeletons.tsx

function SkeletonBar({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-3 animate-pulse"
      style={{ width: w, background: "var(--color-bg-sunk)", borderRadius: 2 }}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="kpi flex flex-col gap-3">
          <SkeletonBar w="55%" />
          <SkeletonBar w="38%" />
          <SkeletonBar w="48%" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head">
        <SkeletonBar w="28%" />
      </div>
      <div className="panel-body flex flex-col gap-5">
        {[82, 63, 47, 31].map((w, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between">
              <SkeletonBar w="36%" />
              <SkeletonBar w="12%" />
            </div>
            <div className="bar">
              <div
                className="animate-pulse"
                style={{
                  width: `${w}%`,
                  height: "100%",
                  background: "var(--color-bg-sunk)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlertSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head">
        <SkeletonBar w="42%" />
      </div>
      <div className="panel-body flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonBar w={`${78 - i * 12}%`} />
            <SkeletonBar w="30%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head">
        <SkeletonBar w="28%" />
      </div>
      <div className="table-container">
        <div className="flex flex-col" style={{ padding: "12px 0" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4"
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--color-rule-faint)",
              }}
            >
              <SkeletonBar w="64px" />
              <SkeletonBar w="140px" />
              <SkeletonBar w="80px" />
              <SkeletonBar w="48px" />
              <SkeletonBar w="72px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
