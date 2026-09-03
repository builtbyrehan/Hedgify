type Context = 'alerts' | 'hedges' | 'logs' | 'positions'

const messages: Record<Context, { title: string; sub: string }> = {
  alerts:   { title: 'Portfolio is nominal', sub: 'No drawdowns detected. Trigger a stress test to simulate volatility.' },
  hedges:   { title: 'No active insurance', sub: 'Protective puts are triggered automatically upon drawdown breaches.' },
  logs:     { title: 'System telemetry initialized', sub: 'Real-time event logs will stream here.' },
  positions: { title: 'No positions detected', sub: 'Alpaca paper trading portfolio is currently empty.' },
}

export default function EmptyState({ context }: { context: Context }) {
  const m = messages[context]
  return (
    <div
      style={{ borderColor: 'var(--border-faint)', backgroundColor: 'var(--surface)' }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-[2px] border border-dashed"
    >
      <div style={{ color: 'var(--text)' }} className="text-[13px] font-mono font-medium mb-1">{m.title}</div>
      <div style={{ color: 'var(--text-faint)' }} className="text-[11px] font-mono max-w-[280px]">{m.sub}</div>
    </div>
  )
}
