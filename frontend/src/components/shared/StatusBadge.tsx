type Status = 'fired' | 'processed' | 'skipped' | 'failed' | 'active' | 'expired' | 'closed'

const config: Record<Status, { color: string; border: string; bg: string; dot: string }> = {
  fired:     { color: '#eab308', border: 'rgba(234, 179, 8, 0.25)', bg: 'rgba(234, 179, 8, 0.08)', dot: '#eab308' },
  processed: { color: '#22c55e', border: 'rgba(34, 197, 94, 0.25)', bg: 'rgba(34, 197, 94, 0.08)', dot: '#22c55e' },
  skipped:   { color: '#8A8C93', border: '#232428', bg: '#151619', dot: '#54565C' },
  failed:    { color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', bg: 'rgba(239, 68, 68, 0.08)', dot: '#ef4444' },
  active:    { color: '#22c55e', border: 'rgba(34, 197, 94, 0.25)', bg: 'rgba(34, 197, 94, 0.08)', dot: '#22c55e' },
  expired:   { color: '#54565C', border: '#232428', bg: '#151619', dot: '#54565C' },
  closed:    { color: '#54565C', border: '#232428', bg: '#151619', dot: '#54565C' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = config[status as Status] || config.fired
  return (
    <span
      style={{ color: s.color, borderColor: s.border, backgroundColor: s.bg }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[10px] font-mono font-medium lowercase"
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  )
}
