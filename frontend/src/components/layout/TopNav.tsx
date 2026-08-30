import { useDashboard } from '../../context/DashboardContext'

export default function TopNav() {
  const { wsConnected, lastUpdated, refreshAll } = useDashboard()

  const timeAgo = lastUpdated != null
    ? `${Math.max(0, Math.floor((Date.now() - Number(lastUpdated)) / 1000))}s ago`
    : '—'

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[var(--color-bg-void)]/70 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Mobile logo — hidden on desktop */}
        <div className="flex items-center gap-2.5 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center font-[var(--font-display)] font-bold text-xs text-[var(--color-bg-void)]">h</div>
          <span className="font-[var(--font-display)] font-bold text-sm text-[var(--color-text-primary)]">hedgify</span>
        </div>
        {/* Connection status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border ${wsConnected ? 'bg-[var(--color-accent-cyan)]/8 border-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]' : 'bg-red-500/8 border-red-500/15 text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)]' : 'bg-red-400'}`} />
          {wsConnected ? 'LIVE' : 'OFFLINE'}
        </div>
        <span className="text-xs text-[var(--color-text-dim)] font-mono hidden sm:inline">Updated {timeAgo}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider lowercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/15">paper trading</span>
        <button onClick={refreshAll} className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.08] transition-all text-sm" title="Refresh">↻</button>
      </div>
    </header>
  )
}
