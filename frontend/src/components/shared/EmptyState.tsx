type Context = 'alerts' | 'hedges' | 'logs' | 'positions'

const messages: Record<Context, { icon: string; title: string; sub: string }> = {
  alerts:   { icon: '✓', title: 'Portfolio is healthy.', sub: 'No drawdowns detected. Trigger a stress test to see alerts.' },
  hedges:   { icon: '🛡', title: 'No active insurance.', sub: 'Alerts will trigger hedges automatically.' },
  logs:     { icon: '📄', title: 'System just started.', sub: 'Logs will appear here.' },
  positions: { icon: '🛒', title: 'No positions yet.', sub: 'Buy some stocks in your Alpaca paper account.' },
}

export default function EmptyState({ context }: { context: Context }) {
  const m = messages[context]
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl mb-4">{m.icon}</div>
      <div className="text-[var(--color-text-primary)] font-display font-bold text-sm mb-1">{m.title}</div>
      <div className="text-[var(--color-text-muted)] text-xs max-w-[240px]">{m.sub}</div>
    </div>
  )
}
