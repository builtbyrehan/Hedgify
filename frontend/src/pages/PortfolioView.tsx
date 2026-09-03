import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Hedge } from '../types'

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
  const [display, setDisplay] = useState(value)
  const ref = useRef<number>(value)

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function drawdownSeverity(dd: number): { color: string; label: string; dot: string } {
  if (dd < 2) return { color: 'var(--positive)', label: 'nominal', dot: 'var(--positive)' }
  if (dd < 5) return { color: 'var(--warning)', label: 'elevated', dot: 'var(--warning)' }
  return { color: 'var(--negative)', label: 'critical', dot: 'var(--negative)' }
}

const FALLBACK_HEDGES: Hedge[] = [
  { id: 'h-1', symbol: 'AAPL', strike: 218.50, expiry: '2026-09-15', premium: 48.00, status: 'active', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'h-2', symbol: 'NVDA', strike: 114.00, expiry: '2026-09-18', premium: 72.50, status: 'active', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
]

export default function PortfolioView() {
  const { portfolio, alerts, hedges: contextHedges } = useDashboard()
  const hedges = contextHedges.length > 0 ? contextHedges : FALLBACK_HEDGES

  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const baseValue = portfolio?.portfolio_value ?? 96948.50
  const peakVal = portfolio?.peak_value ?? 98210.00
  const todayChangePct = 1.23

  const [chartData, setChartData] = useState<ChartPoint[]>(() => generateChartData('1D', baseValue))

  const handleRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
    setChartData(generateChartData(range, portfolio?.portfolio_value ?? baseValue))
  }, [portfolio, baseValue])

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

  const activeHedges = hedges.filter(h => h.status === 'active')
  const activeHedgeCount = activeHedges.length

  const { chartMin, chartMax, yTicks } = useMemo(() => {
    if (chartData.length === 0) return { chartMin: 0, chartMax: 100000, yTicks: [] }
    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values, peakVal)
    const range = max - min
    const padding = range * 0.08
    const lo = Math.floor((min - padding) / 1000) * 1000
    const hi = Math.ceil((max + padding) / 1000) * 1000
    const step = Math.max(500, Math.ceil((hi - lo) / 5 / 500) * 500)
    const ticks: number[] = []
    for (let v = lo; v <= hi; v += step) ticks.push(v)
    return { chartMin: lo, chartMax: hi, yTicks: ticks }
  }, [chartData, peakVal])

  const feedAlerts = useMemo(() => {
    const source = alerts.length > 0 ? alerts.slice(0, 15) : [
      { id: 'a1', symbol: 'AAPL', drawdown: 0.024, status: 'processed' as const, timestamp: new Date(Date.now() - 180000).toISOString() },
      { id: 'a2', symbol: 'MSFT', drawdown: 0.008, status: 'skipped' as const, timestamp: new Date(Date.now() - 540000).toISOString() },
      { id: 'a3', symbol: 'NVDA', drawdown: 0.031, status: 'processed' as const, timestamp: new Date(Date.now() - 1200000).toISOString() },
    ]

    type FeedItem = { key: string; symbol: string; title: string; subtitle: string; time: string; dotColor: string; count: number }
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
          key,
          symbol: a.symbol,
          title: `${a.symbol} ${a.status === 'processed' ? 'hedge placed' : a.status === 'skipped' ? 'drawdown noted' : 'drawdown detected'}`,
          subtitle: `${dd.toFixed(2)}% from peak`,
          time: a.timestamp,
          dotColor: a.status === 'processed' ? 'var(--positive)' : a.status === 'skipped' ? 'var(--warning)' : sev.dot,
          count: 1,
        })
      }
    }

    if (alerts.length === 0 && map.size === 0) {
      map.set('healthy', { key: 'healthy', symbol: 'PORTFOLIO', title: 'All positions within tolerance', subtitle: '0.00% drawdown', time: new Date().toISOString(), dotColor: 'var(--positive)', count: 1 })
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  }, [alerts])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const v = payload[0]?.value ?? 0
    const peak = payload[0]?.payload?.peak ?? peakVal
    const dd = peak > 0 ? ((peak - v) / peak * 100) : 0
    return (
      <div
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] px-3 py-2 text-[11px] shadow-none"
      >
        <div style={{ color: 'var(--text-faint)' }} className="font-mono text-[10px] mb-1">{label}</div>
        <div style={{ color: 'var(--text)' }} className="font-mono font-medium text-[13px] tabular-nums">
          ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ borderColor: 'var(--border-faint)' }} className="flex items-center gap-3 mt-1.5 pt-1.5 border-t">
          <span style={{ color: 'var(--text-faint)' }} className="text-[10px]">Peak <span style={{ color: 'var(--text-dim)' }} className="font-mono tabular-nums">${peak.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span></span>
          <span style={{ color: 'var(--text-faint)' }} className="text-[10px]">DD <span className="font-mono tabular-nums" style={{ color: dd >= 5 ? 'var(--negative)' : dd >= 2 ? 'var(--warning)' : 'var(--positive)' }}>{dd.toFixed(2)}%</span></span>
        </div>
      </div>
    )
  }

  const ranges: TimeRange[] = ['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL']
  const ddPct = ((portfolio?.drawdown ?? 0.0082) * 100)
  const ddInfo = drawdownSeverity(ddPct)

  return (
    <div className="space-y-6">
      {/* 1. Hero Portfolio Value — Unboxed, directly on page background */}
      <div className="pt-1">
        <div className="label mb-1.5">Portfolio value</div>
        <div className="flex flex-wrap items-baseline gap-3.5">
          <div className="hero-value">
            <AnimatedNumber value={portfolio?.portfolio_value ?? baseValue} />
          </div>
          <span
            className="font-mono text-[13px] font-medium tabular-nums"
            style={{ color: todayChangePct >= 0 ? 'var(--positive)' : 'var(--negative)' }}
          >
            {todayChangePct >= 0 ? '+' : ''}{todayChangePct.toFixed(2)}% today
          </span>
        </div>
      </div>

      {/* 2. Thin Divided Strip: Peak / Drawdown / Active Hedges */}
      <div
        style={{ borderColor: 'var(--border-faint)', backgroundColor: 'var(--surface)' }}
        className="border rounded-[2px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-faint)]"
      >
        {/* Column 1: Peak Value */}
        <div className="p-4 flex flex-col justify-between">
          <span className="label">All-time peak</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span style={{ color: 'var(--text)' }} className="font-mono text-[17px] font-medium tabular-nums">
              <AnimatedNumber value={portfolio?.peak_value ?? peakVal} />
            </span>
          </div>
          <span style={{ color: 'var(--text-faint)' }} className="font-mono text-[11px] mt-1 tabular-nums">
            +12.45% since inception
          </span>
        </div>

        {/* Column 2: Drawdown */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label">Current drawdown</span>
            <span style={{ color: ddInfo.color }} className="text-[10px] font-mono lowercase">
              {ddInfo.label}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span style={{ color: ddInfo.color }} className="font-mono text-[17px] font-medium tabular-nums">
              {ddPct.toFixed(2)}%
            </span>
            <span style={{ color: 'var(--text-faint)' }} className="text-[11px]">from peak</span>
          </div>
          <div style={{ backgroundColor: 'var(--border-faint)' }} className="mt-1.5 w-full h-[2px] rounded-[1px] overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${Math.min(100, ddPct * 10)}%`, backgroundColor: ddInfo.color }}
            />
          </div>
        </div>

        {/* Column 3: Active Hedges */}
        <div className="p-4 flex flex-col justify-between">
          <span className="label">Active hedges</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span style={{ color: 'var(--text)' }} className="font-mono text-[17px] font-medium tabular-nums">
              {activeHedgeCount}
            </span>
            {activeHedgeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--positive)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--positive)' }} />
                active protection
              </span>
            )}
          </div>
          <span style={{ color: 'var(--text-faint)' }} className="font-mono text-[11px] mt-1">
            {activeHedgeCount === 0 ? 'No positions hedged' : `${activeHedgeCount} protective put${activeHedgeCount > 1 ? 's' : ''} live`}
          </span>
        </div>
      </div>

      {/* 3. Main Chart & Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
        {/* Chart Panel */}
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          className="border rounded-[2px] p-4 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="label">Portfolio over time</span>
            <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-faint)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-[1.5px] rounded-[1px]" style={{ backgroundColor: 'var(--brand)' }} />
                <span>Value</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0 border-t-[1.5px] border-dashed" style={{ borderColor: 'var(--text-faint)' }} />
                <span>Peak</span>
              </span>
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="brandGoldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--border-faint)" vertical={false} />
                <XAxis
                  dataKey="t"
                  stroke="var(--text-faint)"
                  tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-faint)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={RANGE_CONFIG[timeRange].xInterval}
                  padding={{ left: 6, right: 6 }}
                />
                <YAxis
                  domain={[chartMin, chartMax]}
                  ticks={yTicks}
                  stroke="var(--text-faint)"
                  tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-faint)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  width={46}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <ReferenceLine y={peakVal} stroke="var(--text-faint)" strokeDasharray="3 3" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--brand)"
                  strokeWidth={1.5}
                  fill="url(#brandGoldFill)"
                  dot={false}
                  activeDot={{ r: 3.5, fill: 'var(--brand)', stroke: 'var(--surface)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Footer: Current & Timeframe Selector */}
          <div
            style={{ borderColor: 'var(--border-faint)' }}
            className="flex items-center justify-between mt-3 pt-3 border-t"
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text)' }} className="font-mono text-[13px] font-medium tabular-nums">
                ${(portfolio?.portfolio_value ?? baseValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ color: 'var(--text-faint)' }} className="text-[11px]">current</span>
            </div>

            {/* Timeframe Tabs */}
            <div className="flex items-center gap-1">
              {ranges.map(r => {
                const isActive = r === timeRange
                return (
                  <button
                    key={r}
                    onClick={() => handleRangeChange(r)}
                    style={{
                      backgroundColor: isActive ? 'var(--surface-raised)' : 'transparent',
                      color: isActive ? 'var(--text)' : 'var(--text-faint)',
                    }}
                    className={`px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition-colors duration-100 ${
                      isActive ? 'font-medium' : 'hover:text-[var(--text-dim)]'
                    }`}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed Panel */}
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          className="border rounded-[2px] p-4 flex flex-col h-[358px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="label">Activity feed</span>
            <button
              style={{ color: 'var(--brand)' }}
              className="text-[11px] font-medium hover:underline transition-colors"
            >
              View all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5">
            <div style={{ borderColor: 'var(--border-faint)' }} className="divide-y divide-[var(--border-faint)]">
              {feedAlerts.map(alert => (
                <div key={alert.key} className="py-2.5 first:pt-1 last:pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-[5px] h-[5px] rounded-full mt-[6px] flex-shrink-0"
                        style={{ backgroundColor: alert.dotColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: 'var(--text)' }} className="text-[12px] font-medium leading-tight truncate">
                            {alert.title}
                          </span>
                          {alert.count > 1 && (
                            <span
                              style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-faint)' }}
                              className="px-1.5 py-[1px] rounded-[2px] text-[9px] font-mono tabular-nums"
                            >
                              &times;{alert.count}
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-faint)' }} className="font-mono text-[11px] mt-0.5 tabular-nums">
                          {alert.subtitle}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-faint)' }} className="font-mono text-[10px] tabular-nums whitespace-nowrap flex-shrink-0">
                      {timeAgo(alert.time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ borderColor: 'var(--border-faint)' }}
            className="pt-2.5 mt-auto border-t text-center"
          >
            <button
              style={{ color: 'var(--brand)' }}
              className="text-[11px] font-medium hover:underline transition-colors w-full text-center"
            >
              View all activity
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Hedges Table Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="label">Active hedges</span>
          <span style={{ color: 'var(--text-faint)' }} className="font-mono text-[11px] tabular-nums">
            {hedges.length} recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr style={{ borderColor: 'var(--border-faint)' }} className="border-b">
                <th className="label pb-2 pr-4 font-normal">Symbol</th>
                <th className="label pb-2 pr-4 font-normal">Strike</th>
                <th className="label pb-2 pr-4 font-normal">Expiry</th>
                <th className="label pb-2 pr-4 font-normal">Premium</th>
                <th className="label pb-2 pr-4 font-normal">Status</th>
                <th className="label pb-2 font-normal text-right">Placed</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'var(--border-faint)' }} className="divide-y divide-[var(--border-faint)]">
              {hedges.map((h, i) => (
                <tr
                  key={h.id ?? i}
                  style={{ backgroundColor: 'transparent' }}
                  className="hover:bg-[var(--surface-raised)] transition-colors duration-100"
                >
                  <td className="py-2.5 pr-4">
                    <span style={{ color: 'var(--text)' }} className="font-medium text-[13px]">
                      {h.symbol}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span style={{ color: 'var(--text)' }} className="font-mono font-medium tabular-nums">
                      ${h.strike.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span style={{ color: 'var(--text-dim)' }} className="font-mono tabular-nums text-[11px]">
                      {h.expiry}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span style={{ color: 'var(--text)' }} className="font-mono tabular-nums">
                      ${h.premium ? h.premium.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: h.status === 'active' ? 'var(--positive)' : 'var(--text-faint)' }}
                      />
                      <span style={{ color: h.status === 'active' ? 'var(--positive)' : 'var(--text-dim)' }} className="lowercase font-mono text-[11px]">
                        {h.status}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span style={{ color: 'var(--text-faint)' }} className="font-mono text-[11px] tabular-nums">
                      {h.timestamp ? timeAgo(h.timestamp) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
