/* ── Shimmer skeleton component ───────────────────────────── */

export function Skeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`skeleton animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <Skeleton className="h-9 w-1/2" />
    </div>
  );
}