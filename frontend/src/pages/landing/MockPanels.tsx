import { useState, useEffect, useRef } from 'react'

/* ── Mock Panel: Monitor Agent ── */
export function MonitorMock() {
  const [portfolioValue, setPortfolioValue] = useState(124382)
  const [drawdown, setDrawdown] = useState(2.14)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    let val = 124382
    let dd = 2.14
    function tick() {
      val += (Math.random() - 0.48) * 80
      val = Math.max(120000, Math.min(128000, val))
      dd = ((128104 - val) / 128104) * 100
      setPortfolioValue(Math.round(val))
      setDrawdown(Math.round(dd * 100) / 100)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const ddColor = drawdown >= 5 ? '#ef4444' : drawdown >= 2 ? '#eab308' : '#22c55e'

  return (
    <div className="rounded-2xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(17,18,20,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full pulse-live" style={{ backgroundColor: '#22c55e' }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>monitor agent · polling</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(10,11,13,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#54565C' }}>portfolio</div>
          <div className="font-mono font-bold text-[18px] tabular-nums" style={{ color: '#ECEEF1' }}>
            ${portfolioValue.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(10,11,13,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#54565C' }}>peak</div>
          <div className="font-mono font-bold text-[18px] tabular-nums" style={{ color: '#ECEEF1' }}>$128,104</div>
        </div>
      </div>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(10,11,13,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>drawdown</span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ddColor}15`, color: ddColor }}>
            {drawdown >= 5 ? 'critical' : drawdown >= 2 ? 'elevated' : 'nominal'}
          </span>
        </div>
        <div className="font-mono font-bold text-[22px] tabular-nums mb-3" style={{ color: ddColor }}>
          {drawdown.toFixed(2)}%
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, drawdown * 10)}%`,
              backgroundColor: ddColor,
              boxShadow: `0 0 12px ${ddColor}40`,
            }}
          />
        </div>
      </div>

      <div className="text-[9px] font-mono text-center mt-3" style={{ color: '#54565C' }}>
        threshold: 2.00% · interval: 10s
      </div>
    </div>
  )
}

/* ── Mock Panel: Hedge Executor ── */
export function ExecutorMock() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800)
    const t2 = setTimeout(() => setStep(2), 2000)
    const t3 = setTimeout(() => setStep(3), 3200)
    const reset = setTimeout(() => setStep(0), 6000)
    const loop = setInterval(() => {
      setStep(0)
      setTimeout(() => setStep(1), 800)
      setTimeout(() => setStep(2), 2000)
      setTimeout(() => setStep(3), 3200)
    }, 6000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(reset); clearInterval(loop) }
  }, [])

  const steps = [
    { label: 'waiting for alert', sublabel: 'idle', color: '#54565C' },
    { label: 'checking idempotency guard', sublabel: 'verified', color: '#22c55e' },
    { label: 'calculating 5% OTM put', sublabel: 'strike found', color: '#eab308' },
    { label: 'hedge placed · active', sublabel: '14d expiry', color: '#22c55e' },
  ]

  return (
    <div className="rounded-2xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(17,18,20,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step > 0 ? '#22c55e' : 'rgba(255,255,255,0.08)' }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>hedge executor</span>
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-500"
            style={{
              backgroundColor: i <= step ? 'rgba(34, 197, 94, 0.04)' : 'rgba(10,11,13,0.4)',
              borderColor: i <= step ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
              opacity: i <= step ? 1 : 0.3,
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
              style={{
                backgroundColor: i <= step ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                color: i <= step ? '#22c55e' : '#54565C',
              }}
            >
              {i <= step ? '✓' : (i + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono font-medium" style={{ color: i <= step ? '#ECEEF1' : '#54565C' }}>
                {s.label}
              </div>
              {i <= step && i > 0 && (
                <div className="text-[9px] font-mono mt-0.5" style={{ color: '#22c55e' }}>{s.sublabel}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {step >= 3 && (
        <div className="mt-3 p-4 rounded-xl border fade-in-up" style={{ backgroundColor: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#54565C' }}>strike</div>
              <div className="text-[13px] font-mono font-bold" style={{ color: '#ECEEF1' }}>$218.50</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#54565C' }}>expiry</div>
              <div className="text-[13px] font-mono font-bold" style={{ color: '#ECEEF1' }}>14d</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#54565C' }}>premium</div>
              <div className="text-[13px] font-mono font-bold" style={{ color: '#ECEEF1' }}>$48.00</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Mock Panel: Live Dashboard ── */
export function DashboardMock() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(p => (p + 1) % 6)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const events = [
    { time: '10:32:01', value: 124382, type: 'value' as const },
    { time: '10:32:01', value: null, type: 'alert' as const, text: 'AAPL alert fired · 2.14%' },
    { time: '10:32:02', value: null, type: 'hedge' as const, text: 'AAPL put · $218.50 · 14d' },
    { time: '10:32:03', value: 124100, type: 'value' as const },
    { time: '10:32:05', value: null, type: 'alert' as const, text: 'NVDA alert fired · 3.01%' },
    { time: '10:32:06', value: null, type: 'hedge' as const, text: 'NVDA put · $114.00 · 14d' },
  ]

  const typeStyles = {
    value: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.04)', color: '#ECEEF1' },
    alert: { bg: 'rgba(234, 179, 8, 0.04)', border: 'rgba(234, 179, 8, 0.12)', color: '#eab308' },
    hedge: { bg: 'rgba(34, 197, 94, 0.04)', border: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' },
  }

  return (
    <div className="rounded-2xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(17,18,20,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full pulse-live" style={{ backgroundColor: '#22c55e' }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>websocket · live</span>
      </div>

      <div className="space-y-2">
        {events.slice(0, idx + 1).map((e, i) => {
          const s = typeStyles[e.type]
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border slide-in-row"
              style={{ backgroundColor: s.bg, borderColor: s.border }}
            >
              <span className="text-[9px] font-mono w-14 shrink-0 tabular-nums" style={{ color: '#54565C' }}>{e.time}</span>
              {e.type === 'value' && (
                <span className="text-[11px] font-mono font-medium" style={{ color: s.color }}>
                  portfolio ${e.value?.toLocaleString()}
                </span>
              )}
              {e.type === 'alert' && (
                <span className="text-[11px] font-mono" style={{ color: s.color }}>
                  {e.text}
                </span>
              )}
              {e.type === 'hedge' && (
                <span className="text-[11px] font-mono" style={{ color: s.color }}>
                  {e.text}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Mock Panel: Stress Test ── */
export function StressTestMock() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<null | { unhedged: number; hedged: number; saved: number }>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setRunning(true), 1000)
    const t2 = setTimeout(() => {
      setRunning(false)
      setResult({ unhedged: -3450, hedged: -1200, saved: 2250 })
    }, 2500)
    const reset = setTimeout(() => { setResult(null); setRunning(false) }, 6000)
    const loop = setInterval(() => {
      setResult(null)
      setRunning(false)
      setTimeout(() => setRunning(true), 500)
      setTimeout(() => {
        setRunning(false)
        setResult({ unhedged: -3450, hedged: -1200, saved: 2250 })
      }, 1800)
    }, 6000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(reset); clearInterval(loop) }
  }, [])

  return (
    <div className="rounded-2xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(17,18,20,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>stress test · AAPL -10%</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: 'rgba(10,11,13,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#54565C' }}>unhedged</div>
          <div className="text-[15px] font-mono font-bold tabular-nums" style={{ color: '#ef4444' }}>
            {running ? '...' : result ? `-$${Math.abs(result.unhedged).toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: 'rgba(10,11,13,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#54565C' }}>hedged</div>
          <div className="text-[15px] font-mono font-bold tabular-nums" style={{ color: '#ECEEF1' }}>
            {running ? '...' : result ? `-$${Math.abs(result.hedged).toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
          <div className="text-[9px] font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#54565C' }}>saved</div>
          <div className="text-[15px] font-mono font-bold tabular-nums" style={{ color: '#22c55e' }}>
            {running ? '...' : result ? `$${result.saved.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {result && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border fade-in-up" style={{ backgroundColor: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.15)' }}>
          <span className="text-[13px]">🛡</span>
          <span className="text-[11px] font-mono" style={{ color: '#ECEEF1' }}>
            put payout covered ${Math.abs(result.unhedged - result.hedged).toLocaleString()} of loss
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Mock Panel: Safety / Paper Trading ── */
export function SafetyMock() {
  const items = [
    { icon: '🔒', label: 'paper trading only', desc: 'no real funds at risk' },
    { icon: '🔄', label: 'auto-reconnect', desc: 'websocket recovers in 5s' },
    { icon: '📊', label: 'mock data fallback', desc: 'dashboard works offline' },
    { icon: '🔌', label: 'MCP bridge (planned)', desc: 'broker-agnostic future' },
  ]

  return (
    <div className="rounded-2xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(17,18,20,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>safety features</span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(10,11,13,0.4)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="text-[14px]">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono font-medium" style={{ color: '#ECEEF1' }}>{item.label}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: '#54565C' }}>{item.desc}</div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  )
}
