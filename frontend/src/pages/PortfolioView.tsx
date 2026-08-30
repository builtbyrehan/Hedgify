import { useState, useEffect, useRef, useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

type ChartPoint = { t: string; value: number; peak: number }
type Toast = { id: number; message: string; icon: string; color: string }

function AnimatedNumber({ value, duration = 800, prefix = '$' }: { value: number; duration?: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const diff = value - start
    if (Math.abs(diff) < 0.01) { setDisplay(value); return }
    const startTime = performance.now()
    let raf: number
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + diff * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else ref.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  const formatted = prefix
    ? `${prefix}${display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <span className="font-[var(--font-mono)] tabular-nums">{formatted}</span>
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

interface DedupEntry { key: string; count: number; timestamp: number }

export default function PortfolioView() {
  const { portfolio, alerts, hedges } = useDashboard()
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const [chartData, setChartData] = useState<ChartPoint[]>(() => {
    const points: ChartPoint[] = []
    const base = portfolio?.portfolio_value ?? 100000
    const peak = portfolio?.peak_value ?? base
    for (let i = 0; i < 18; i++) {
      const t = new Date(Date.now() - (17 - i) * 10000)
      const drift = (Math.random() - 0.5) * base * 0.003
      const v = Math.max(50000, base + drift - (17 - i) * base * 0.001)
      points.push({
        t: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        value: Math.round(v * 100) / 100,
        peak: Math.round(Math.max(peak, v) * 100) / 100,
      })
    }
    return points
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (portfolio) {
      setChartData(prev => {
        const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        const next = [...prev, { t, value: portfolio.portfolio_value, peak: portfolio.peak_value }]
        return next.length > 40 ? next.slice(next.length - 40) : next
      })
    }
  }, [portfolio])

  // Toast notifications for new alerts/hedges
  const prevAlertCount = useRef(alerts.length)
  const prevHedgeCount = useRef(hedges.length)
  useEffect(() => {
    if (alerts.length > prevAlertCount.current) {
      const latest = alerts[0]
      const id = ++toastIdRef.current
      setToasts(prev => [...prev, { id, message: `🔔 ${latest.symbol} — ${(latest.drawdown * 100).toFixed(2)}% drawdown detected`, icon: '🔔', color: 'border-[var(--color-accent-danger)]/20' }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    prevAlertCount.current = alerts.length
  }, [alerts])

  useEffect(() => {
    if (hedges.length > prevHedgeCount.current) {
      const latest = hedges[0]
      const id = ++toastIdRef.current
      setToasts(prev => [...prev, { id, message: `🛡 ${latest.symbol} put placed · $${latest.strike.toFixed(0)} strike`, icon: '🛡', color: 'border-[var(--color-accent-gold)]/20' }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    prevHedgeCount.current = hedges.length
  }, [hedges])

  const dedupedAlerts = useMemo(() => {
    const map = new Map<string, DedupEntry>()
    const result: (typeof alerts[0] & { repeat: number })[] = []
    for (const alert of alerts) {
      const key = `${alert.symbol}-${alert.status}`
      const existing = map.get(key)
      if (existing && Date.now() - existing.timestamp < 300000) {
        existing.count++
        const idx = result.findIndex(r => `${r.symbol}-${r.status}` === key)
        if (idx >= 0) result[idx] = { ...result[idx], repeat: existing.count }
      } else {
        map.set(key, { key, count: 1, timestamp: Date.now() })
        result.push({ ...alert, repeat: 1 })
      }
    }
    return result
  }, [alerts])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [dedupedAlerts.length])

  const chartPeak = portfolio?.peak_value ?? 100000

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const v = payload[0]?.value ?? 0
    const peak = payload[0]?.payload?.peak ?? chartPeak
    const dd = peak > 0 ? ((peak - v) / peak * 100) : 0
    return (
      <div className="rounded-xl border border-white/10 bg-[var(--color-bg-surface)]/95 backdrop-blur-md px-4 py-3 shadow-xl">
        <div className="text-[var(--color-text-dim)] text-[10px] font-mono mb-1">{label}</div>
        <div className="text-[var(--color-text-primary)] font-bold font-[var(--font-display)] text-sm">${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="text-[var(--color-text-muted)] text-[10px] mt-1">peak: ${peak.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="text-[var(--color-text-muted)] text-[10px]">dd: <span className={dd >= 2 ? 'text-[var(--color-accent-danger)]' : 'text-emerald-400'}>{dd.toFixed(2)}%</span></div>
      </div>
    )
  }

  const activeHedgeCount = hedges.filter(h => h.status === 'active').length

  return (
    <div className="space-y-6 relative">
      {/* Floating toast notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-chip toast-enter border ${toast.color}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Stat callout cards — Xocial style: big number + lowercase label */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="stat-callout">
            <div className="stat-label">portfolio value</div>
            <div className="stat-number text-2xl sm:text-3xl text-[var(--color-text-primary)]">
              <AnimatedNumber value={portfolio?.portfolio_value ?? 0} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="stat-callout">
            <div className="stat-label">all-time peak</div>
            <div className="stat-number text-2xl sm:text-3xl text-[var(--color-text-primary)]">
              <AnimatedNumber value={portfolio?.peak_value ?? 0} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="stat-callout">
            <div className="stat-label">current drawdown</div>
            <div className={`stat-number text-2xl sm:text-3xl ${(portfolio?.drawdown ?? 0) >= 0.02 ? 'text-[var(--color-accent-danger)]' : 'text-emerald-400'}`}>
              {((portfolio?.drawdown ?? 0) * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="stat-callout">
            <div className="stat-label">active hedges</div>
            <div className="stat-number text-2xl sm:text-3xl text-[var(--color-accent-cyan)] flex items-center gap-2">
              <span className="text-lg">🛡</span> {activeHedgeCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_0.95fr] gap-6">
        {/* Portfolio Chart */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
          <div className="section-num">portfolio over time</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" stroke="#5e667e" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#5e667e" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={chartPeak} stroke="#4ade80" strokeDasharray="6 4" strokeWidth={1.5} />
                <ReferenceLine y={chartPeak * 0.98} stroke="#f5567a" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '2% dd', position: 'right', fill: '#f5567a', fontSize: 10, fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#valueGrad)" dot={false} activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0c1120', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col">
          <div className="section-num">live alerts</div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 max-h-[320px] pr-1">
            {dedupedAlerts.length === 0 ? (
              <EmptyState context="alerts" />
            ) : (
              dedupedAlerts.map((alert, i) => (
                <div key={`${alert.id}-${i}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-primary)] font-[var(--font-display)] font-bold text-sm">{alert.symbol}</span>
                    <StatusBadge status={alert.status} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
                    <span>dd: <span className="text-[var(--color-accent-danger)]">{(alert.drawdown * 100).toFixed(2)}%</span></span>
                    <span>{timeAgo(alert.timestamp)}</span>
                  </div>
                  {alert.repeat > 1 && (
                    <div className="text-[10px] font-mono text-[var(--color-text-dim)]">×{alert.repeat} repeats</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Hedges Table */}
      {hedges.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
          <div className="section-num">active hedges</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3 pr-4">symbol</th>
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3 pr-4">strike</th>
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3 pr-4">expiry</th>
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3 pr-4">premium</th>
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3 pr-4">status</th>
                  <th className="text-left text-[var(--color-text-dim)] font-mono text-[10px] font-bold tracking-wider lowercase pb-3">time</th>
                </tr>
              </thead>
              <tbody>
                {hedges.map((h, i) => (
                  <tr key={h.id ?? i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 font-[var(--font-display)] font-bold text-[var(--color-text-primary)]">{h.symbol}</td>
                    <td className="py-3 pr-4 font-mono text-[var(--color-text-muted)]">${h.strike.toFixed(2)}</td>
                    <td className="py-3 pr-4 font-mono text-[var(--color-text-muted)]">{h.expiry}</td>
                    <td className="py-3 pr-4 font-mono text-[var(--color-text-muted)]">${h.premium?.toFixed(2) ?? '--'}</td>
                    <td className="py-3 pr-4"><StatusBadge status={h.status} /></td>
                    <td className="py-3 font-mono text-[var(--color-text-dim)] text-xs">{h.timestamp ? timeAgo(h.timestamp) : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
