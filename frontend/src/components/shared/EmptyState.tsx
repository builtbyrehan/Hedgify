type Context = 'alerts' | 'hedges' | 'logs' | 'positions'

const messages: Record<Context, { title: string; sub: string }> = {
  alerts:   { title: 'Portfolio is healthy.', sub: 'No drawdowns detected. Trigger a stress test to see alerts.' },
  hedges:   { title: 'No active insurance.', sub: 'Alerts will trigger hedges automatically.' },
  logs:     { title: 'System just started.', sub: 'Logs will appear here.' },
  positions: { title: 'No positions yet.', sub: 'Buy some stocks in your Alpaca paper account.' },
}

export default function EmptyState({ context }: { context: Context }) {
  const m = messages[context]
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-page)]">
      <div className="text-[var(--color-text-primary)] text-[13px] font-medium mb-1">{m.title}</div>
      <div className="text-[var(--color-text-secondary)] text-[12px] max-w-[240px]">{m.sub}</div>
    </div>
  )
}
