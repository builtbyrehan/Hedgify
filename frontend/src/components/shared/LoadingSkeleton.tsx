type SkeletonType = 'card' | 'chart' | 'table'

export default function LoadingSkeleton({ type = 'card' }: { type?: SkeletonType }) {
  if (type === 'chart') {
    return (
      <div className="card p-6">
        <div className="h-4 w-32 rounded bg-[var(--color-bg-hover)] animate-pulse mb-4" />
        <div className="h-[300px] rounded-xl bg-[var(--color-bg-hover)] animate-pulse" />
      </div>
    )
  }
  if (type === 'table') {
    return (
      <div className="card p-6">
        <div className="h-4 w-24 rounded bg-[var(--color-bg-hover)] animate-pulse mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-[var(--color-bg-hover)] animate-pulse mb-2" />
        ))}
      </div>
    )
  }
  return (
    <div className="card p-6">
      <div className="h-4 w-20 rounded bg-[var(--color-bg-hover)] animate-pulse mb-3" />
      <div className="h-8 w-32 rounded bg-[var(--color-bg-hover)] animate-pulse mb-2" />
      <div className="h-3 w-24 rounded bg-[var(--color-bg-hover)] animate-pulse" />
    </div>
  )
}
