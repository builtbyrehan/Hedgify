type Status = 'fired' | 'processed' | 'skipped' | 'failed' | 'active' | 'expired' | 'closed'

const config: Record<Status, { color: string; bg: string }> = {
  fired:     { color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/10' },
  processed: { color: 'text-[var(--color-positive)]', bg: 'bg-[var(--color-positive)]/10' },
  skipped:   { color: 'text-[var(--color-text-tertiary)]', bg: 'bg-[var(--color-bg-hover)]' },
  failed:    { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/10' },
  active:    { color: 'text-[var(--color-text-primary)]', bg: 'bg-[var(--color-bg-active)]' },
  expired:   { color: 'text-[var(--color-text-tertiary)]', bg: 'bg-[var(--color-bg-hover)]' },
  closed:    { color: 'text-[var(--color-text-tertiary)]', bg: 'bg-[var(--color-bg-hover)]' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = config[status as Status] || config.fired
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${s.color} ${s.bg}`}>
      {status}
    </span>
  )
}
