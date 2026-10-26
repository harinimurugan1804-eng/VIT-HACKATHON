/**
 * components/Skeletons.tsx
 * Skeleton loading states for tables, cards, tiles.
 */

/* Single skeleton block */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/* Skeleton for an incident table row */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-subtle)]">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-4 w-24 ml-auto" />
    </div>
  )
}

/* Skeleton for a camera tile */
export function SkeletonCameraTile() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-t-[var(--radius)] rounded-b-none" />
      <div className="p-3 flex items-center gap-2">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-10 ml-auto" />
      </div>
    </div>
  )
}

/* Skeleton for an incident card in the live feed */
export function SkeletonIncidentCard() {
  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/* List of N skeleton rows */
export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/* List of N skeleton camera tiles */
export function SkeletonCameraGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCameraTile key={i} />
      ))}
    </div>
  )
}
