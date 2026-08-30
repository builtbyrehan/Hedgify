import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import type { Portfolio, Alert, Hedge, LogEntry } from '../types'
import { probeApi, getApiBase, getWsUrl, fetchPortfolio, fetchAlerts, fetchHedges, fetchLogs } from '../services/api'

type DashboardState = {
  portfolio: Portfolio | null
  alerts: Alert[]
  hedges: Hedge[]
  logs: LogEntry[]
  wsConnected: boolean
  apiBase: string | null
  lastUpdated: number | null
  refreshAll: () => Promise<void>
}

const DashboardContext = createContext<DashboardState | null>(null)

const MOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA']

function mockDrift(prev: Portfolio | null): Portfolio {
  const base = prev?.portfolio_value ?? 100000
  const drift = (Math.random() - 0.5) * base * 0.002
  const value = Math.max(50000, base + drift)
  const peak = Math.max(prev?.peak_value ?? value, value)
  const drawdown = peak > 0 ? (peak - value) / peak : 0
  return { portfolio_value: value, peak_value: peak, drawdown }
}

function mockAlerts(): Alert[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `mock-alert-${i}`,
    symbol: MOCK_SYMBOLS[i % MOCK_SYMBOLS.length],
    drawdown: Math.random() * 0.1 + 0.02,
    status: (['fired', 'processed', 'skipped'] as const)[Math.floor(Math.random() * 3)],
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    premium: Math.round(Math.random() * 100 + 20),
  }))
}

function mockHedges(): Hedge[] {
  return Array.from({ length: 3 }, (_, i) => ({
    id: `mock-hedge-${i}`,
    symbol: MOCK_SYMBOLS[i % MOCK_SYMBOLS.length],
    strike: Math.round(200 + Math.random() * 50),
    expiry: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString().slice(0, 10),
    status: (['active', 'active', 'expired'] as const)[Math.floor(Math.random() * 3)],
    premium: Math.round(Math.random() * 80 + 30),
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  }))
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [hedges, setHedges] = useState<Hedge[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [apiBase, setApiBase] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  const refreshAll = useCallback(async () => {
    const base = getApiBase()
    if (!base) return
    const [p, a, h, l] = await Promise.all([
      fetchPortfolio(),
      fetchAlerts(),
      fetchHedges(),
      fetchLogs(),
    ])
    if (!mountedRef.current) return
    if (p) setPortfolio(p)
    if (a.length > 0) setAlerts(a)
    if (h.length > 0) setHedges(h)
    if (l.length > 0) setLogs(l)
    setLastUpdated(Date.now())
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let reconnectTimer: ReturnType<typeof setTimeout>
    let pollTimer: ReturnType<typeof setInterval>

    function connectWs() {
      if (!mountedRef.current) return
      const url = getWsUrl()
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!mountedRef.current) return
          setWsConnected(true)
        }

        ws.onmessage = (e) => {
          if (!mountedRef.current) return
          try {
            const msg = JSON.parse(e.data)
            if (msg.type === 'ALERT') {
              setAlerts((prev) => {
                const next = [
                  {
                    id: msg.id ?? Date.now(),
                    symbol: msg.symbol ?? msg.stock_symbol ?? 'AAPL',
                    drawdown: typeof msg.drawdown === 'string' ? parseFloat(msg.drawdown) / 100 : msg.drawdown ?? 0,
                    status: msg.status ?? 'fired',
                    timestamp: msg.timestamp ?? new Date().toISOString(),
                    premium: msg.premium,
                  },
                  ...prev,
                ]
                return next.slice(0, 50)
              })
            } else if (msg.type === 'HEDGE_PLACED') {
              setHedges((prev) => {
                const next = [
                  {
                    id: msg.id ?? Date.now(),
                    symbol: msg.symbol ?? msg.stock_symbol ?? 'AAPL',
                    strike: msg.strike ?? msg.strike_price ?? 0,
                    expiry: msg.expiry ?? msg.expiry_date ?? '',
                    status: 'active' as const,
                    premium: msg.premium ?? msg.premium_paid ?? 50,
                    timestamp: msg.timestamp ?? new Date().toISOString(),
                  },
                  ...prev,
                ]
                return next.slice(0, 30)
              })
            }
            setLastUpdated(Date.now())
          } catch { /* malformed message */ }
        }

        ws.onclose = () => {
          if (!mountedRef.current) return
          setWsConnected(false)
          wsRef.current = null
          reconnectTimer = setTimeout(connectWs, 5000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        reconnectTimer = setTimeout(connectWs, 5000)
      }
    }

    async function init() {
      const base = await probeApi()
      if (!mountedRef.current) return
      setApiBase(base)

      if (base) {
        await refreshAll()
        connectWs()
        pollTimer = setInterval(refreshAll, 10000)
      } else {
        setPortfolio(mockDrift(null))
        setAlerts(mockAlerts())
        setHedges(mockHedges())
        setLogs([])
        pollTimer = setInterval(() => {
          if (!mountedRef.current) return
          setPortfolio((prev) => mockDrift(prev))
        }, 10000)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      wsRef.current?.close()
      clearTimeout(reconnectTimer)
      clearInterval(pollTimer)
    }
  }, [refreshAll])

  return (
    <DashboardContext.Provider
      value={{ portfolio, alerts, hedges, logs, wsConnected, apiBase, lastUpdated, refreshAll }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
