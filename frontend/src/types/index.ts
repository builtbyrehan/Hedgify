export type Portfolio = {
  portfolio_value: number
  peak_value: number
  drawdown: number
}

export type Alert = {
  id: number | string
  symbol: string
  drawdown: number
  status: 'fired' | 'processed' | 'skipped' | 'failed'
  timestamp: string
  premium?: number
}

export type Hedge = {
  id: number | string
  symbol: string
  strike: number
  expiry: string
  status: 'active' | 'expired' | 'closed'
  premium?: number
  timestamp?: string
}

export type LogEntry = {
  id: number | string
  timestamp: string
  agent: 'Monitor' | 'Executor'
  event_type: string
  message: string
  severity: 'info' | 'warning' | 'error'
}

export type StressTestResult = {
  symbol: string
  current_price: number
  drop_pct: number
  new_price: number
  unhedged_loss: number
  hedged_loss: number
  put_payout: number
  premium_cost: number
  money_saved: number
  cpr: number
}
