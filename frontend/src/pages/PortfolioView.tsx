import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

type ChartPoint = { t: string; value: number; peak: number }
type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

const RANGE_CONFIG: Record<TimeRange, { points: number; intervalMs: number; format: (d: Date) => string; xInterval: number }> = {
  '1D': { points: 24, intervalMs: 3600000, format: d => d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }), xInterval: 3 },
  '7D': { points: 7, intervalMs: 86400000, format: d => d.toLocaleDateString('en-US', { weekday: 'short' }), xInterval: 1 },
  '1M': { points: 30, intervalMs: 86400000, format: d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xInterval: 6 },
  '3M': { points: 12, intervalMs: 604800000, format: d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xInterval: 2 },
  '6M': { points: 6, intervalMs: 2592000000, format: d => d.toLocaleDateString('en-US', { month: 'short' }), xInterval: 1 },
  '1Y': { points: 12, intervalMs: 2592000000, format: d => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), xInterval: 2 },
  'ALL': { points: 24, intervalMs: 2592000000, format: d => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), xInterval: 6 },
}

const COLORS = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-danger)',
  chartPeak: 'var(--color-chart-peak)',
  chartGrid: 'var(--color-border-subtle)',
  severityLow: 'var(--color-severity-low)',
  severityMed: 'var(--color-severity-med)',
  severityHigh: 'var(--color-severity-high)',
}

function generateChartData(range: TimeRange, baseValue: number): ChartPoint[] {
  const config = RANGE_CONFIG[range]
  const points: ChartPoint[] = []
  let value = baseValue * (range === 'ALL' ? 0.85 : range === '1Y' ? 0.92 : range === '6M' ? 0.95 : 0.98)
  let peak = value
  const seed = baseValue * 1000

  for (let i = 0; i < config.points; i++) {
    const t = new Date(Date.now() - (config.points - 1 - i) * config.intervalMs)
    const volatility = range === '1D' ? 0.0008 : range === '7D' ? 0.003 : 0.006
    const pseudo = Math.sin(seed + i * 7.3) * 0.5 + 0.5
    const drift = (pseudo - 0.48) * baseValue * volatility
    value = Math.max(baseValue * 0.85, Math.min(baseValue * 1.05, value + drift))
    peak = Math.max(peak, value)
    points.push({ t: config.format(t), value: Math.round(value * 100) / 100, peak: Math.round(peak * 100) / 100 })
  }
  if (points.length > 0) {
    points[points.length - 1].value = baseValue
    points[points.length - 1].peak = Math.max(peak, baseValue)
  }
  return points
}

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
  return <span className="tabular-nums">{formatted}</span>
}

function Sparkline({ data, color = COLORS.positive }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#spark-fill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function drawdownSeverity(dd: number): { color: string; bg: string; label: string; tier: 'low' | 'med' | 'high' } {
  if (dd < 5) return { color: COLORS.severityLow, bg: 'var(--color-bg-hover)', label: 'Nominal', tier: 'low' }
  if (dd < 15) return { color: COLORS.severityMed, bg: 'var(--color-bg-hover)', label: 'Elevated', tier: 'med' }
  return { color: COLORS.severityHigh, bg: 'var(--color-bg-hover)', label: 'Critical', tier: 'high' }
}

export default function PortfolioView() {
  const { portfolio, alerts, hedges } = useDashboard()
  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const baseValue = portfolio?.portfolio_value ?? 96948
  const peakVal = portfolio?.peak_value ?? 96962

  const [chartData, setChartData] = useState<ChartPoint[]>(() => generateChartData('1D', baseValue))
  const handleRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
    setChartData(generateChartData(range, portfolio?.portfolio_value ?? 96948))
  }, [portfolio])

  const sparkValues = useMemo(() => chartData.map(d => d.value), [chartData])

  useEffect(() => {
    if (portfolio) {
      setChartData(prev => {
        const config = RANGE_CONFIG[timeRange]
        const t = config.format(new Date())
        const next = [...prev, { t, value: portfolio.portfolio_value, peak: portfolio.peak_value }]
        return next.length > config.points + 5 ? next.slice(next.length - config.points) : next
      })
    }
  }, [portfolio, timeRange])

  const activeHedgeCount = hedges.filter(h => h.status === 'active').length
  const chartPeak = peakVal

  const { chartMin, chartMax, yTicks } = useMemo(() => {
    if (chartData.length === 0) return { chartMin: 0, chartMax: 100000, yTicks: [] }
    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values, chartPeak)
    const range = max - min
    const padding = range * 0.08
    const lo = Math.floor((min - padding) / 1000) * 1000
    const hi = Math.ceil((max + padding) / 1000) * 1000
    const step = Math.ceil((hi - lo) / 5 / 1000) * 1000
    const ticks: number[] = []
    for (let v = lo; v <= hi; v += step) ticks.push(v)
    return { chartMin: lo, chartMax: hi, yTicks: ticks }
  }, [chartData, chartPeak])

  const feedAlerts = useMemo(() => {
    const source = alerts.length > 0 ? alerts.slice(0, 20) : [
      { id: 'h1', symbol: 'AAPL', drawdown: 0.004, status: 'processed' as const, timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: 'h2', symbol: 'MSFT', drawdown: 0.001, status: 'skipped' as const, timestamp: new Date(Date.now() - 600000).toISOString() },
    ]
    type FeedItem = { key: string; title: string; description: string; time: string; severity: 'low' | 'med' | 'high' | 'info'; count: number }
    const map = new Map<string, FeedItem>()
    for (const a of source) {
      const dd = a.drawdown * 100
      const sev = drawdownSeverity(dd)
      const key = `${a.symbol}-${a.status}`
      const existing = map.get(key)
      if (existing) {
        existing.count++
        if (new Date(a.timestamp).getTime() > new Date(existing.time).getTime()) existing.time = a.timestamp
      } else {
        map.set(key, {
          key, title: `${a.symbol} drawdown detected`, description: `${dd.toFixed(1)}% from peak`,
          time: a.timestamp, severity: sev.tier, count: 1,
        })
      }
    }
    if (alerts.length === 0) {
      map.set('healthy', { key: 'healthy', title: 'All positions within tolerance', description: 'No hedging action required', time: new Date().toISOString(), severity: 'info', count: 1 })
      map.set('monitoring', { key: 'monitoring', title: 'Market session active', description: 'Monitoring 5 symbols', time: new Date(Date.now() - 300000).toISOString(), severity: 'info', count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)
  }, [alerts])

  const feedDotColors: Record<string, string> = {
    low: COLORS.severityLow,
    med: COLORS.severityMed,
    high: COLORS.severityHigh,
    info: 'var(--color-text-tertiary)',
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const v = payload[0]?.value ?? 0
    const peak = payload[0]?.payload?.peak ?? chartPeak
    const dd = peak > 0 ? ((peak - v) / peak * 100) : 0
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 shadow-md">
        <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 font-mono">{label}</div>
        <div className="text-[14px] font-semibold text-[var(--color-text-primary)] font-mono tabular-nums">${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-[var(--color-border-subtle)]">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">Peak <span className="font-medium text-[var(--color-text-secondary)] font-mono tabular-nums">${peak.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span></span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">DD <span className="font-medium font-mono tabular-nums" style={{ color: dd >= 5 ? COLORS.negative : dd >= 2 ? COLORS.severityMed : COLORS.positive }}>{dd.toFixed(2)}%</span></span>
        </div>
      </div>
    )
  }

  const ranges: TimeRange[] = ['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL']
  const ddPct = ((portfolio?.drawdown ?? 0) * 100)
  const ddInfo = drawdownSeverity(ddPct)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value — primary */}
        <div className="card p-5">
          <div className="label mb-2">Portfolio Value</div>
          <div className="text-[26px] font-semibold text-[var(--color-text-primary)] leading-none tracking-tight">
            <AnimatedNumber value={portfolio?.portfolio_value ?? 0} />
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-[12px] font-medium" style={{ color: COLORS.positive }}>+1.23% today</span>
            <div className="w-16"><Sparkline data={sparkValues} /></div>
          </div>
        </div>

        {/* All-Time Peak */}
        <div className="card p-5">
          <div className="label mb-2">All-Time Peak</div>
          <div className="text-[20px] font-semibold text-[var(--color-text-primary)] leading-none tracking-tight tabular-nums">
            <AnimatedNumber value={portfolio?.peak_value ?? 0} />
          </div>
          <div className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">+12.45% since inception</div>
        </div>

        {/* Drawdown */}
        <div className="card p-5">
          <div className="label mb-2">Drawdown</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-semibold leading-none tracking-tight tabular-nums" style={{ color: ddInfo.color }}>{ddPct.toFixed(2)}%</span>
          </div>
          <div className="mt-3">
            <div className="w-full h-1 rounded-full bg-[var(--color-bg-hover)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ddPct * 5)}%`, backgroundColor: ddInfo.color }} />
            </div>
            <div className="text-[11px] mt-1.5 font-medium" style={{ color: ddInfo.color }}>{ddInfo.label}</div>
          </div>
        </div>

        {/* Active Hedges */}
        <div className="card p-5">
          <div className="label mb-2">Active Hedges</div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-semibold text-[var(--color-text-primary)] leading-none tabular-nums">{activeHedgeCount}</span>
            {activeHedgeCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.positive }} />
                hedging
              </span>
            )}
          </div>
          <div className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
            {activeHedgeCount === 0 ? 'No positions hedged' : `${activeHedgeCount} protective put${activeHedgeCount > 1 ? 's' : ''} active`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Portfolio Over Time</div>
            <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-[1.5px] rounded" style={{ backgroundColor: COLORS.positive }} />Value</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0 border-t-[1.5px] border-dashed" style={{ borderColor: COLORS.chartPeak }} />Peak</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: 'var(--color-positive)', stopOpacity: 0.10 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-positive)', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} vertical={false} />
                <XAxis dataKey="t" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} interval={RANGE_CONFIG[timeRange].xInterval} padding={{ left: 4, right: 4 }} />
                  <YAxis domain={[chartMin, chartMax]} ticks={yTicks} stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={52} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
                <ReferenceLine y={chartPeak} stroke={COLORS.chartPeak} strokeDasharray="6 4" strokeWidth={1} />
                <Area type="monotone" dataKey="value" stroke={COLORS.positive} strokeWidth={1.5} fill="url(#valueFill)" dot={false} activeDot={{ r: 3, fill: COLORS.positive, stroke: 'var(--color-bg-card)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">${(portfolio?.portfolio_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">current</span>
            </div>
            <div className="flex items-center gap-0.5">
              {ranges.map(r => (
                <button key={r} onClick={() => handleRangeChange(r)} className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${r === timeRange ? 'text-[var(--color-text-primary)] bg-[var(--color-bg-active)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Activity Feed</div>
            <button className="text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto -mx-1">
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {feedAlerts.map(alert => (
                <div key={alert.key} className="py-2.5 px-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-[6px] h-[6px] rounded-full mt-[7px] flex-shrink-0" style={{ backgroundColor: feedDotColors[alert.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium leading-tight text-[var(--color-text-primary)]">{alert.title}</span>
                        {alert.count > 1 && (
                          <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] text-[9px] font-mono font-medium tabular-nums">&times;{alert.count}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{alert.description}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] whitespace-nowrap flex-shrink-0 tabular-nums">{timeAgo(alert.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
            <button className="text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-full text-center">View all activity</button>
          </div>
        </div>
      </div>

      {hedges.length > 0 && (
        <div className="card p-5">
          <div className="label mb-4">Active Hedges</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left label pb-2.5 pr-4 font-normal">Symbol</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Strike</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Expiry</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Premium</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Status</th>
                  <th className="text-left label pb-2.5 font-normal">Placed</th>
                </tr>
              </thead>
              <tbody>
                {hedges.map((h, i) => (
                  <tr key={h.id ?? i} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-[var(--color-text-primary)]">{h.symbol}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[var(--color-text-secondary)]">${h.strike.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[var(--color-text-secondary)]">{h.expiry}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[var(--color-text-secondary)]">${h.premium?.toFixed(2) ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${h.status === 'active' ? 'text-[var(--color-text-primary)] bg-[var(--color-bg-active)]' : 'text-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono tabular-nums text-[var(--color-text-tertiary)] text-[11px]">{h.timestamp ? timeAgo(h.timestamp) : '—'}</td>
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
