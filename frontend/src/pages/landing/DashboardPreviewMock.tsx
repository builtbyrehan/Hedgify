import { useState, useEffect, useRef } from 'react'

function AnimatedValue({ base }: { base: number }) {
  const [value, setValue] = useState(base)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    let current = base
    function tick() {
      const drift = (Math.random() - 0.48) * base * 0.0003
      current = Math.max(base * 0.97, Math.min(base * 1.03, current + drift))
      setValue(current)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [base])

  return (
    <span className="font-mono font-bold text-[20px] tabular-nums" style={{ color: '#ECEEF1' }}>
      ${Math.round(value).toLocaleString()}
    </span>
  )
}

export default function DashboardPreviewMock() {
  const [showAlert, setShowAlert] = useState(false)
  const [showHedge, setShowHedge] = useState(false)
  const [alertPulse, setAlertPulse] = useState(false)

  useEffect(() => {
    const alertTimer = setTimeout(() => {
      setShowAlert(true)
      setAlertPulse(true)
    }, 2000)

    const hedgeTimer = setTimeout(() => {
      setShowHedge(true)
    }, 3500)

    const resetTimer = setTimeout(() => {
      setShowAlert(false)
      setShowHedge(false)
      setAlertPulse(false)
    }, 8000)

    const loopTimer = setInterval(() => {
      setShowAlert(false)
      setShowHedge(false)
      setAlertPulse(false)
      setTimeout(() => {
        setShowAlert(true)
        setAlertPulse(true)
      }, 1500)
      setTimeout(() => {
        setShowHedge(true)
      }, 3000)
    }, 10000)

    return () => {
      clearTimeout(alertTimer)
      clearTimeout(hedgeTimer)
      clearTimeout(resetTimer)
      clearInterval(loopTimer)
    }
  }, [])

  return (
    <div className="relative">
      <div
        style={{ backgroundColor: '#111214', borderColor: '#232428' }}
        className="relative border rounded-[6px] p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full pulse-live" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#54565C' }}>live monitor</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: '#54565C' }}>paper trading</span>
        </div>

        <div className="p-3 rounded-[4px] border" style={{ backgroundColor: '#0A0B0D', borderColor: '#232428' }}>
          <div className="text-[10px] font-mono mb-1" style={{ color: '#54565C' }}>portfolio value</div>
          <AnimatedValue base={124382} />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono" style={{ color: '#54565C' }}>peak $127,104</span>
            <span className="text-[11px] font-mono" style={{ color: '#eab308' }}>-2.14%</span>
          </div>
        </div>

        <div className="h-16 rounded-[4px] border p-2 flex items-end gap-[2px]" style={{ backgroundColor: '#0A0B0D', borderColor: '#232428' }}>
          {[40, 45, 42, 38, 35, 40, 48, 52, 50, 46, 42, 38, 35, 30, 32, 36, 40, 44, 48, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[1px] transition-all duration-300"
              style={{
                height: `${h}%`,
                backgroundColor: i >= 12 ? '#22c55e' : '#232428',
                opacity: i >= 12 ? 1 : 0.4,
              }}
            />
          ))}
        </div>

        <div
          className="flex items-center gap-2 p-2 rounded-[4px] border transition-all duration-500"
          style={{
            backgroundColor: showAlert ? 'rgba(234, 179, 8, 0.05)' : 'transparent',
            borderColor: showAlert ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
            opacity: showAlert ? 1 : 0,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alertPulse ? '#eab308' : 'transparent' }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono" style={{ color: '#ECEEF1' }}>
              {showAlert ? 'AAPL drawdown alert' : ''}
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#54565C' }}>
              {showAlert ? 'threshold breached · 2.14% from peak' : ''}
            </div>
          </div>
          {showAlert && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              fired
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2 p-2 rounded-[4px] border transition-all duration-500"
          style={{
            backgroundColor: showHedge ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
            borderColor: showHedge ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
            opacity: showHedge ? 1 : 0,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: showHedge ? '#22c55e' : 'transparent' }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono" style={{ color: '#ECEEF1' }}>
              {showHedge ? 'Hedge placed' : ''}
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#54565C' }}>
              {showHedge ? 'AAPL put · $218.50 strike · 14d expiry' : ''}
            </div>
          </div>
          {showHedge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              active
            </span>
          )}
        </div>

        <div className="text-[10px] font-mono uppercase tracking-wider pt-1" style={{ color: '#54565C' }}>active hedges</div>
        <div className="space-y-1">
          {[
            { symbol: 'AAPL', strike: '$218.50', expiry: '14d', status: 'active' },
            { symbol: 'NVDA', strike: '$114.00', expiry: '7d', status: 'active' },
          ].map((h, i) => (
            <div key={i} className="flex items-center justify-between py-1 px-2 rounded-[3px] border" style={{ backgroundColor: '#0A0B0D', borderColor: '#232428' }}>
              <span className="text-[11px] font-mono font-medium" style={{ color: '#ECEEF1' }}>{h.symbol}</span>
              <span className="text-[10px] font-mono" style={{ color: '#8A8C93' }}>{h.strike}</span>
              <span className="text-[10px] font-mono" style={{ color: '#54565C' }}>{h.expiry}</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-[10px] font-mono" style={{ color: '#22c55e' }}>{h.status}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
