import { useState } from 'react'
import { placeTrade, type TradeResult } from '../services/api'

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'SPY', 'QQQ']

export default function TradePage() {
  const [symbol, setSymbol] = useState('AAPL')
  const [strike, setStrike] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TradeResult | null>(null)

  const defaultExpiry = () => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  }

  useState(() => { setExpiry(defaultExpiry()) })

  async function handleTrade() {
    if (!strike || !expiry) return
    setLoading(true)
    setResult(null)
    const res = await placeTrade({
      symbol: symbol.toUpperCase(),
      strike: parseFloat(strike),
      expiry,
      qty,
    })
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div>
        <h1 className="text-[16px] font-mono font-medium text-[var(--text)] mb-1">Manual options trade</h1>
        <p className="text-[12px] text-[var(--text-dim)]">Place protective put orders directly via Alpaca paper trading.</p>
      </div>

      {/* Symbol Selector */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-3">
        <span className="label block">Underlying symbol</span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              style={{
                backgroundColor: symbol === s ? 'var(--brand)' : 'var(--surface-raised)',
                color: symbol === s ? 'var(--bg)' : 'var(--text)',
                borderColor: symbol === s ? 'var(--brand)' : 'var(--border)',
              }}
              className="border rounded-[2px] px-3 py-1.5 font-mono text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              {s}
            </button>
          ))}
        </div>
        <div>
          <label className="label mb-1.5 block">Or enter custom symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
            className="w-full max-w-[200px] border rounded-[2px] px-2.5 py-1.5 font-mono text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Order Parameters */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-3">
        <span className="label block">Order parameters</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label mb-1.5 block">Strike price ($)</label>
            <input
              type="number"
              value={strike}
              onChange={e => setStrike(e.target.value)}
              placeholder="e.g. 220"
              min={1}
              step={0.5}
              style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              className="w-full border rounded-[2px] px-2.5 py-1.5 font-mono text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--brand)] transition-colors tabular-nums"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Expiry date</label>
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              className="w-full border rounded-[2px] px-2.5 py-1.5 font-mono text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Quantity (contracts)</label>
            <input
              type="number"
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={100}
              style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              className="w-full border rounded-[2px] px-2.5 py-1.5 font-mono text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--brand)] transition-colors tabular-nums"
            />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">1 contract = 100 shares</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {strike && (
        <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-2">
          <span className="label block">Order preview</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-faint)] block">Symbol</span>
              <span className="text-[var(--text)]">{symbol} P</span>
            </div>
            <div>
              <span className="text-[var(--text-faint)] block">Strike</span>
              <span className="text-[var(--text)]">${parseFloat(strike).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[var(--text-faint)] block">Expiry</span>
              <span className="text-[var(--text)]">{expiry}</span>
            </div>
            <div>
              <span className="text-[var(--text-faint)] block">Qty</span>
              <span className="text-[var(--text)]">{qty}x</span>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: result.ok ? 'var(--positive)' : 'var(--negative)',
          }}
          className="border rounded-[2px] p-4"
        >
          {result.ok ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--positive)' }} className="text-[13px] font-mono font-medium">Order placed</span>
                <span
                  style={{
                    backgroundColor: result.mode === 'simulated' ? 'var(--warning)' : 'var(--positive)',
                    color: 'var(--bg)',
                  }}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[1px] uppercase"
                >
                  {result.mode}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-[var(--text-faint)] block">Order ID</span>
                  <span className="text-[var(--text)]">{result.order_id?.slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-faint)] block">Premium</span>
                  <span className="text-[var(--text)]">${result.premium?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-faint)] block">Status</span>
                  <span className="text-[var(--text)]">{result.status}</span>
                </div>
                <div>
                  <span className="text-[var(--text-faint)] block">Contracts</span>
                  <span className="text-[var(--text)]">{result.qty}x</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span style={{ color: 'var(--negative)' }} className="text-[13px] font-mono font-medium">Order failed</span>
              <p className="text-[11px] font-mono text-[var(--text-faint)] mt-1">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTrade}
        disabled={loading || !strike || !expiry}
        style={{ backgroundColor: 'var(--brand)', color: 'var(--bg)' }}
        className="py-2.5 px-6 rounded-[2px] font-mono text-[12px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Placing order...' : `Buy ${symbol} Put`}
      </button>
    </div>
  )
}
