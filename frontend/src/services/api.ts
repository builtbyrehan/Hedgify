import type { Portfolio, Alert, Hedge, LogEntry, StressTestResult } from '../types'

const API_CANDIDATES = ['http://localhost:8000', 'http://localhost:5000']
const WS_CANDIDATES = ['ws://localhost:8000/ws', 'ws://localhost:5000/ws']

let _apiBase: string | null = null

export async function probeApi(): Promise<string | null> {
  for (const base of API_CANDIDATES) {
    try {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 1200)
      const r = await fetch(`${base}/health`, { signal: c.signal })
      clearTimeout(t)
      if (r.ok) { _apiBase = base; return base }
    } catch { /* try next */ }
  }
  _apiBase = null
  return null
}

export function getApiBase(): string | null { return _apiBase }

export function getWsUrl(): string {
  return _apiBase
    ? `ws://${new URL(_apiBase).host}/ws`
    : WS_CANDIDATES[0]
}

export async function fetchPortfolio(): Promise<Portfolio | null> {
  if (!_apiBase) return null
  try {
    const r = await fetch(`${_apiBase}/api/v1/portfolio`)
    if (!r.ok) return null
    const data = await r.json()
    return {
      portfolio_value: data.portfolio_value,
      peak_value: data.peak_value || data.portfolio_value,
      drawdown: data.drawdown || data.drawdown_pct || 0,
    }
  } catch { return null }
}

export async function fetchAlerts(): Promise<Alert[]> {
  if (!_apiBase) return []
  try {
    const r = await fetch(`${_apiBase}/api/v1/alerts`)
    if (!r.ok) return []
    const data = await r.json()
    if (!Array.isArray(data)) return []
    return data.map((x: any, i: number) => ({
      id: x.id ?? i,
      symbol: x.symbol ?? x.stock_symbol ?? 'AAPL',
      drawdown: typeof x.drawdown === 'string' ? parseFloat(x.drawdown) / 100 : x.drawdown ?? 0,
      status: x.status,
      timestamp: x.timestamp,
    }))
  } catch { return [] }
}

export async function fetchHedges(): Promise<Hedge[]> {
  if (!_apiBase) return []
  try {
    const r = await fetch(`${_apiBase}/api/v1/hedges`)
    if (!r.ok) return []
    const data = await r.json()
    if (!Array.isArray(data)) return []
    return data.map((x: any, i: number) => ({
      id: x.id ?? i,
      symbol: x.symbol ?? x.stock_symbol ?? 'AAPL',
      strike: x.strike ?? x.strike_price ?? 0,
      expiry: x.expiry ?? x.expiry_date ?? '',
      status: x.status,
      premium: x.premium ?? x.premium_paid ?? 50,
      timestamp: x.timestamp,
    }))
  } catch { return [] }
}

export async function fetchLogs(): Promise<LogEntry[]> {
  if (!_apiBase) return []
  try {
    const r = await fetch(`${_apiBase}/api/v1/logs`)
    if (!r.ok) return []
    const data = await r.json()
    if (!Array.isArray(data)) return []
    return data.map((x: any, i: number) => ({
      id: x.id ?? i,
      timestamp: x.timestamp ?? new Date().toISOString(),
      agent: x.agent ?? 'Monitor',
      event_type: x.event_type ?? x.type ?? 'POLL',
      message: x.message ?? '',
      severity: x.severity ?? 'info',
    }))
  } catch { return [] }
}

export async function runStressTest(symbol: string, dropPct: number): Promise<StressTestResult | null> {
  if (!_apiBase) return null
  for (const path of ['/api/v1/stress-test', '/api/v1/simulate-drawdown', '/api/v1/simulate']) {
    try {
      const r = await fetch(`${_apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawdown_pct: Math.abs(dropPct), symbol }),
      })
      if (r.ok) {
        const data = await r.json()
        const currentPrice = data.current_price ?? 230
        const newPrice = currentPrice * (1 + dropPct)
        const unhedgedLoss = data.unhedged_loss ?? (currentPrice - newPrice) * 100
        const putPayout = data.put_payout ?? Math.max(0, (data.strike ?? currentPrice * 0.95) - newPrice) * 100
        const premiumCost = data.premium_cost ?? data.premium ?? 50
        const moneySaved = data.money_saved ?? Math.max(0, putPayout - premiumCost)
        const cpr = unhedgedLoss > 0 ? Math.min(1, moneySaved / Math.abs(unhedgedLoss)) : 0
        return {
          symbol,
          current_price: currentPrice,
          drop_pct: dropPct,
          new_price: newPrice,
          unhedged_loss: unhedgedLoss,
          hedged_loss: unhedgedLoss + premiumCost - putPayout,
          put_payout: putPayout,
          premium_cost: premiumCost,
          money_saved: moneySaved,
          cpr,
        }
      }
    } catch { /* try next */ }
  }
  return null
}

// ─── Runtime Config (Settings page) ───────────────────────────────

export async function fetchConfig(): Promise<Record<string, any> | null> {
  if (!_apiBase) return null
  try {
    const r = await fetch(`${_apiBase}/api/v1/config`)
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

export async function updateConfig(updates: Record<string, any>): Promise<{ ok: boolean; error?: string }> {
  if (!_apiBase) return { ok: false, error: 'Backend offline' }
  try {
    const r = await fetch(`${_apiBase}/api/v1/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return { ok: false, error: data.detail ?? `HTTP ${r.status}` }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}