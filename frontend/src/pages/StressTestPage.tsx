import { useState, useMemo } from 'react'
import { runStressTest } from '../services/api'
import type { StressTestResult } from '../types'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Dropdown from '../components/shared/Dropdown'

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META']

function CprGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 60 ? 'var(--positive)' : pct >= 40 ? 'var(--warning)' : 'var(--negative)'

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-faint)" strokeWidth="7" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-mono font-medium tabular-nums" style={{ color }}>{pct}%</span>
        <span className="text-[9px] font-mono text-[var(--text-faint)] uppercase">CPR</span>
      </div>
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      className="border rounded-[2px] px-3 py-2 text-[11px] shadow-none"
    >
      <div style={{ color: 'var(--text-faint)' }} className="font-mono text-[10px] mb-0.5">{label}</div>
      <div style={{ color: 'var(--text)' }} className="font-mono font-medium text-[13px] tabular-nums">
        ${Math.abs(payload[0]?.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}

export default function StressTestPage() {
  const [symbol, setSymbol] = useState('AAPL')
  const [dropPct, setDropPct] = useState(-15)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<StressTestResult | null>(null)

  const currentPrice = 230
  const sharesHeld = 100

  async function handleRun() {
    setRunning(true)
    try {
      let res = await runStressTest(symbol, dropPct / 100)
      if (!res) {
        const price = currentPrice
        const newPrice = price * (1 + dropPct / 100)
        const unhedgedLoss = (price - newPrice) * sharesHeld
        const putStrike = Math.round(price * 0.95 * 100) / 100
        const putPayout = Math.max(0, (putStrike - newPrice) * sharesHeld)
        const premiumCost = 50
        const hedgedLoss = unhedgedLoss + premiumCost - putPayout
        const moneySaved = Math.max(0, unhedgedLoss - hedgedLoss)
        const cpr = unhedgedLoss > 0 ? moneySaved / Math.abs(unhedgedLoss) : 0
        res = {
          symbol,
          current_price: price,
          drop_pct: dropPct / 100,
          new_price: Math.round(newPrice * 100) / 100,
          unhedged_loss: Math.round(unhedgedLoss * 100) / 100,
          hedged_loss: Math.round(hedgedLoss * 100) / 100,
          put_payout: Math.round(putPayout * 100) / 100,
          premium_cost: Math.round(premiumCost * 100) / 100,
          money_saved: Math.round(moneySaved * 100) / 100,
          cpr: Math.round(cpr * 10000) / 10000,
        }
      }
      setResult(res)
    } catch {
      const price = currentPrice
      const newPrice = price * (1 + dropPct / 100)
      const unhedgedLoss = (price - newPrice) * sharesHeld
      const putStrike = Math.round(price * 0.95 * 100) / 100
      const putPayout = Math.max(0, (putStrike - newPrice) * sharesHeld)
      const premiumCost = 50
      const hedgedLoss = unhedgedLoss + premiumCost - putPayout
      const moneySaved = Math.max(0, unhedgedLoss - hedgedLoss)
      const cpr = unhedgedLoss > 0 ? moneySaved / Math.abs(unhedgedLoss) : 0
      setResult({
        symbol,
        current_price: price,
        drop_pct: dropPct / 100,
        new_price: Math.round(newPrice * 100) / 100,
        unhedged_loss: Math.round(unhedgedLoss * 100) / 100,
        hedged_loss: Math.round(hedgedLoss * 100) / 100,
        put_payout: Math.round(putPayout * 100) / 100,
        premium_cost: premiumCost,
        money_saved: Math.round(moneySaved * 100) / 100,
        cpr: Math.round(cpr * 10000) / 10000,
      })
    } finally {
      setRunning(false)
    }
  }

  const chartData = useMemo(() => {
    if (!result) return []
    return [
      { name: 'Unhedged loss', value: result.unhedged_loss, color: 'var(--negative)' },
      { name: 'Hedged loss', value: result.hedged_loss, color: 'var(--text-dim)' },
      { name: 'Put payout', value: result.put_payout, color: 'var(--positive)' },
      { name: 'Capital saved', value: result.money_saved, color: 'var(--brand)' },
    ]
  }, [result])

  const presets = [-5, -10, -15, -20, -30]

  return (
    <div className="space-y-6">
      {/* Simulation Controls Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <span className="label block mb-3">Crash simulator parameters</span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Symbol */}
          <div>
            <label className="label mb-1.5 block">Position to shock</label>
            <Dropdown
              value={symbol}
              onChange={setSymbol}
              size="sm"
              options={SYMBOLS.map(s => ({ value: s, label: `${s} ($${currentPrice}.00)` }))}
            />
          </div>

          {/* Shock Magnitude */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label">Simulated price drop</label>
              <span className="font-mono text-[12px] text-[var(--negative)] font-medium tabular-nums">{dropPct}%</span>
            </div>
            <div className="flex gap-1 mb-2">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setDropPct(p)}
                  style={{
                    backgroundColor: dropPct === p ? 'var(--surface-raised)' : 'transparent',
                    borderColor: dropPct === p ? 'var(--border)' : 'var(--border-faint)',
                    color: dropPct === p ? 'var(--text)' : 'var(--text-faint)',
                  }}
                  className="flex-1 py-1 text-[10px] font-mono border rounded-[2px] transition-colors"
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="range"
              min="-40"
              max="-1"
              value={dropPct}
              onChange={e => setDropPct(Number(e.target.value))}
              className="w-full h-1 bg-[var(--border-faint)] rounded-[1px] accent-[var(--brand)] cursor-pointer"
            />
          </div>

          {/* Execute Button */}
          <div>
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                backgroundColor: 'var(--brand)',
                color: 'var(--bg)',
              }}
              className="w-full py-2 px-4 rounded-[2px] font-mono text-[12px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? 'Simulating shock...' : 'Run stress test'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section — The Demo Climax */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
          {/* Hero Results Strip: Unhedged Loss, Hedged Loss, CPR */}
          <div>
            <span className="label block mb-2">Simulation outcome ({result.symbol} at {result.drop_pct * 100}% shock)</span>

            <div
              style={{ borderColor: 'var(--border-faint)', backgroundColor: 'var(--surface)' }}
              className="border rounded-[2px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-faint)]"
            >
              {/* Card 1: Unhedged Loss */}
              <div className="p-5 flex flex-col justify-between">
                <span className="label">Unhedged loss (no insurance)</span>
                <div className="my-2">
                  <div className="hero-value text-[var(--negative)]">
                    -${result.unhedged_loss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
                  Position falls from ${result.current_price} → ${result.new_price}
                </div>
              </div>

              {/* Card 2: Hedged Loss */}
              <div className="p-5 flex flex-col justify-between">
                <span className="label">Hedged loss (with put active)</span>
                <div className="my-2">
                  <div className="hero-value text-[var(--text)]">
                    -${result.hedged_loss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
                  Put payout: +${result.put_payout.toFixed(2)} (premium: ${result.premium_cost.toFixed(2)})
                </div>
              </div>

              {/* Card 3: Capital Preservation Rate & Saved */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex flex-col justify-between h-full">
                  <span className="label">Capital preservation</span>
                  <div className="my-1">
                    <div className="text-[24px] font-mono font-medium text-[var(--positive)] tabular-nums">
                      +${result.money_saved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">total capital saved</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--positive)] tabular-nums">
                    {(result.cpr * 100).toFixed(1)}% of loss prevented
                  </div>
                </div>
                <CprGauge value={result.cpr} />
              </div>
            </div>
          </div>

          {/* Breakdown Chart Panel */}
          <div
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="border rounded-[2px] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="label">Shock impact breakdown</span>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">Values in USD</span>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="var(--border-faint)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-faint)"
                    tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-faint)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-faint)"
                    tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-faint)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={48}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
