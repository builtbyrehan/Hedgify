import type { ReactNode } from 'react'

type Status = 'fired' | 'processed' | 'skipped' | 'failed' | 'active' | 'expired' | 'closed'

const config: Record<Status, { bg: string; text: string; border: string; icon: ReactNode }> = {
  fired:     { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: '🔔' },
  processed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: '✓' },
  skipped:   { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: '⊘' },
  failed:    { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: '✕' },
  active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: '🛡' },
  expired:   { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: '⏰' },
  closed:    { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: '⊘' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = config[status as Status] || config.fired
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border ${s.bg} ${s.text} ${s.border}`}>
      <span className="text-xs">{s.icon}</span>
      {status}
    </span>
  )
}
