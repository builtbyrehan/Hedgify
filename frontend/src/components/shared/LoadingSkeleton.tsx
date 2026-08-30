type SkeletonType = 'card' | 'chart' | 'table'

export default function LoadingSkeleton({ type = 'card' }: { type?: SkeletonType }) {
  if (type === 'chart') {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-4 w-32 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-[300px] rounded-xl bg-white/5 animate-pulse" />
      </div>
    )
  }
  if (type === 'table') {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-4 w-24 rounded bg-white/5 animate-pulse mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-white/3 animate-pulse mb-2" />
        ))}
      </div>
    )
  }
  return (
    <div className="glass rounded-2xl p-6">
      <div className="h-4 w-20 rounded bg-white/5 animate-pulse mb-3" />
      <div className="h-8 w-32 rounded bg-white/5 animate-pulse mb-2" />
      <div className="h-3 w-24 rounded bg-white/3 animate-pulse" />
    </div>
  )
}
