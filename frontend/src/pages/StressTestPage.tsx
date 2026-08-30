import { useState, useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { runStressTest } from '../services/api'
import type { StressTestResult } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META']

function CprGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 60 ? '#22d3ee' : pct >= 40 ? '#f5c451' : '#f5567a'

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-2xl" style={{ color }}>{pct}%</span>
        <span className="text-[9px] font-mono text-text-dim tracking-wider uppercase">CPR</span>
      </div>
    </div>
  )
}

function ResultCard({ title, color, items }: { title: string; color: string; items: { label: string; value: string; big?: boolean }[] }) {
  const borderColor = color === 'danger' ? 'border-danger/20' : color === 'emerald' ? 'border-emerald-500/20' : 'border-gold/20'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border ${borderColor} bg-white/[0.03] backdrop-blur-sm p-6`}
    >
      <div className={`text-xs font-mono font-bold tracking-wider uppercase mb-4 ${
        color === 'danger' ? 'text-danger' : color === 'emerald' ? 'text-emerald-400' : 'text-gold'
      }`}>
        {title}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-text-muted text-xs font-mono">{item.label}</span>
            <span className={`font-mono ${item.big ? 'font-display font-black text-xl' : 'font-bold text-sm'} ${
              color === 'danger' ? 'text-danger' : color === 'emerald' ? 'text-emerald-400' : 'text-text-primary'
            }`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-surface/95 backdrop-blur-md px-4 py-3 shadow-xl">
      <div className="text-text-dim text-[10px] font-mono mb-1">{label}</div>
      <div className="text-text-primary font-bold font-display text-sm">
        ${Math.abs(payload[0]?.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}

export default function StressTestPage() {
  const { hedges } = useDashboard()
  const [symbol, setSymbol] = useState('AAPL')
  const [dropPct, setDropPct] = useState(-15)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<StressTestResult | null>(null)

  const currentPrice = 230
  const sharesHeld = 100
  const activeHedge = useMemo(() => hedges.find(h => h.symbol === symbol && h.status === 'active'), [hedges, symbol])

  async function handleRun() {
    setRunning(true)
    try {
      let res = await runStressTest(symbol, dropPct / 100)
      if (!res) {
        const price = currentPrice
        const newPrice = price * (1 + dropPct / 100)
        const unhedgedLoss = (price - newPrice) * sharesHeld
        const putStrike = Math.round(price * 0.95)
        const putPayout = Math.max(0, (putStrike - newPrice) * sharesHeld)
        const premiumCost = Math.round(unhedgedLoss * 0.08) || 50
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
      setResult({
        symbol,
        current_price: price,
        drop_pct: dropPct / 100,
        new_price: Math.round(newPrice * 100) / 100,
        unhedged_loss: Math.round(unhedgedLoss * 100) / 100,
        hedged_loss: 0,
        put_payout: 0,
        premium_cost: 0,
        money_saved: 0,
        cpr: 0,
      })
    }
    setRunning(false)
  }

  const barData = result ? [
    { name: 'Without Hedge', loss: Math.abs(result.unhedged_loss) },
    { name: 'With Hedge', loss: Math.abs(result.hedged_loss) },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-text-primary mb-1">Stress Test Simulator</h1>
        <p className="text-text-muted text-sm">Simulate a market crash and see how your hedge protects you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6 space-y-5">
          <div>
            <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2 block">Stock Symbol</label>
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-primary font-mono text-sm px-4 py-3 focus:outline-none focus:border-cyan/40 transition-colors appearance-none cursor-pointer"
            >
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2 block">
              Hypothetical Drop
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={-50}
                max={-1}
                value={dropPct}
                onChange={e => setDropPct(Number(e.target.value))}
                className="flex-1 accent-cyan h-1.5"
              />
              <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                <input
                  type="number"
                  min={-50}
                  max={-1}
                  value={dropPct}
                  onChange={e => {
                    const v = Number(e.target.value)
                    if (v >= -50 && v <= -1) setDropPct(v)
                  }}
                  className="w-14 bg-transparent text-danger font-mono text-sm text-center focus:outline-none font-bold"
                />
                <span className="text-text-dim font-mono text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2 block">Current Price</label>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-muted font-mono text-sm px-4 py-3">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2 block">Shares Held</label>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-muted font-mono text-sm px-4 py-3">
                {sharesHeld}
              </div>
            </div>
          </div>

          <div>
            <label className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-2 block">Active Hedge</label>
            {activeHedge ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                <span>🛡</span>
                {activeHedge.symbol} Put @ ${activeHedge.strike} — Exp {activeHedge.expiry}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-text-dim text-xs font-mono">
                No active hedge for {symbol}
              </div>
            )}
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-void font-display font-bold text-sm shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulating...
              </span>
            ) : (
              'Run Simulation'
            )}
          </button>
        </div>

        {/* Right: Results */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard
                  title="Without Hedge"
                  color="danger"
                  items={[
                    { label: 'New Price', value: `$${result.new_price.toFixed(2)}` },
                    { label: 'Portfolio Loss', value: `-$${Math.abs(result.unhedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, big: true },
                    { label: 'Total Damage', value: `$${Math.abs(result.unhedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  ]}
                />
                <ResultCard
                  title="With Hedge"
                  color="emerald"
                  items={[
                    { label: 'Put Payout', value: `+$${result.put_payout.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                    { label: 'Premium Cost', value: `-$${result.premium_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                    { label: 'Net Loss', value: `$${Math.abs(result.hedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                    { label: 'Money Saved', value: `$${result.money_saved.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, big: true },
                  ]}
                />
              </div>

              {/* CPR Gauge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-gold/20 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col items-center"
              >
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-gold mb-4">Capital Preservation Rate</div>
                <CprGauge value={result.cpr} />
                {result.cpr >= 0.6 && (
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
                    <span>✓</span> Target Met (≥60%)
                  </div>
                )}
              </motion.div>

              {/* Comparison Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6"
              >
                <div className="text-text-dim text-[10px] font-mono font-bold tracking-wider uppercase mb-4">Loss Comparison</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#5e667e"
                        tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#5e667e"
                        tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                        width={70}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="loss" radius={[8, 8, 0, 0]} maxBarSize={80}>
                        {barData.map((_, idx) => (
                          <Cell key={idx} fill={idx === 0 ? '#f5567a' : '#4ade80'} />
                        ))}
                        <LabelList
                          dataKey="loss"
                          position="top"
                          formatter={(v) => `$${Math.abs(Number(v)).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                          style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, fill: '#f4f6fb' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4">🧪</div>
              <div className="text-text-primary font-display font-bold text-sm mb-1">Run a simulation</div>
              <div className="text-text-muted text-xs max-w-[240px]">Configure your scenario on the left, then hit Run Simulation to see results.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
