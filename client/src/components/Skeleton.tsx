interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'var(--bg-tertiary)' }}
    />
  );
}

export function BeerTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <th className="p-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Category</th>
            <th className="p-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Beer</th>
            <th className="p-4 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Base</th>
            <th className="p-4 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Current</th>
            <th className="p-4 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Change</th>
            <th className="p-4 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Quantity</th>
            <th className="p-4 text-center text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="table-row">
              <td className="p-4">
                {i % 2 === 0 && <Skeleton className="h-6 w-16" />}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </td>
              <td className="p-4 text-right">
                <Skeleton className="h-4 w-12 ml-auto" />
              </td>
              <td className="p-4 text-right">
                <Skeleton className="h-6 w-16 ml-auto" />
              </td>
              <td className="p-4 text-right">
                <Skeleton className="h-4 w-14 ml-auto" />
              </td>
              <td className="p-4">
                <Skeleton className="h-10 w-16 mx-auto" />
              </td>
              <td className="p-4">
                <Skeleton className="h-10 w-16 mx-auto rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      {/* Controls skeleton */}
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Chart area skeleton */}
      <div className="h-[350px] flex items-end gap-2 p-4" style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t"
            style={{
              background: 'var(--border-color)',
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Skeleton className="h-3 w-16 mx-auto mb-2" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="w-px h-10" style={{ background: 'var(--border-color)' }} />
      <div className="text-center">
        <Skeleton className="h-3 w-20 mx-auto mb-2" />
        <Skeleton className="h-8 w-12" />
      </div>
    </div>
  );
}
