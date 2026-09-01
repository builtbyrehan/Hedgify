import { useState, useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { runStressTest } from '../services/api'
import type { StressTestResult } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import Dropdown from '../components/shared/Dropdown'

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META']

const COLORS = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-danger)',
  accent: 'var(--color-text-primary)',
  chartGrid: 'var(--color-border-subtle)',
  gaugeTrack: 'var(--color-border)',
  gaugeSuccess: 'var(--color-positive)',
  gaugeWarning: 'var(--color-warning)',
  gaugeDanger: 'var(--color-danger)',
}

function CprGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 60 ? COLORS.gaugeSuccess : pct >= 40 ? COLORS.gaugeWarning : COLORS.gaugeDanger

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={COLORS.gaugeTrack} strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-semibold font-mono tabular-nums" style={{ color }}>{pct}%</span>
        <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] tracking-wider uppercase">CPR</span>
      </div>
    </div>
  )
}

function ResultCard({ title, color, items }: { title: string; color: 'danger' | 'success'; items: { label: string; value: string; big?: boolean }[] }) {
  const borderColor = color === 'danger' ? 'var(--color-danger)' : 'var(--color-positive)'
  const titleColor = color === 'danger' ? COLORS.negative : COLORS.positive
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-xl border bg-[var(--color-bg-card)] p-5" style={{ borderColor }}>
      <div className="label mb-3" style={{ color: titleColor }}>{title}</div>
      <div className="space-y-2.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[12px] font-mono text-[var(--color-text-secondary)]">{item.label}</span>
            <span className={`font-mono ${item.big ? 'text-[18px] font-semibold' : 'text-[13px] font-medium'}`} style={{ color: color === 'danger' ? COLORS.negative : item.big ? COLORS.positive : 'var(--color-text-primary)' }}>
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
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-sm">
      <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold font-mono text-[var(--color-text-primary)]">
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
        res = { symbol, current_price: price, drop_pct: dropPct / 100, new_price: Math.round(newPrice * 100) / 100, unhedged_loss: Math.round(unhedgedLoss * 100) / 100, hedged_loss: Math.round(hedgedLoss * 100) / 100, put_payout: Math.round(putPayout * 100) / 100, premium_cost: Math.round(premiumCost * 100) / 100, money_saved: Math.round(moneySaved * 100) / 100, cpr: Math.round(cpr * 10000) / 10000 }
      }
      setResult(res)
    } catch {
      const price = currentPrice
      const newPrice = price * (1 + dropPct / 100)
      const unhedgedLoss = (price - newPrice) * sharesHeld
      setResult({ symbol, current_price: price, drop_pct: dropPct / 100, new_price: Math.round(newPrice * 100) / 100, unhedged_loss: Math.round(unhedgedLoss * 100) / 100, hedged_loss: 0, put_payout: 0, premium_cost: 0, money_saved: 0, cpr: 0 })
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
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-1">Stress Test Simulator</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">Simulate a market crash and see how your hedge protects you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-5">
          <div>
            <label className="label mb-1.5 block">Stock Symbol</label>
            <Dropdown value={symbol} onChange={setSymbol} options={SYMBOLS.map(s => ({ value: s, label: s }))} />
          </div>

          <div>
            <label className="label mb-1.5 block">Hypothetical Drop</label>
            <div className="flex items-center gap-4">
              <input type="range" min={-50} max={-1} value={dropPct} onChange={e => setDropPct(Number(e.target.value))} className="flex-1 h-1.5 rounded-full appearance-none bg-[var(--color-border)]" style={{ accentColor: COLORS.accent }} />
              <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2">
                <input type="number" min={-50} max={-1} value={dropPct} onChange={e => { const v = Number(e.target.value); if (v >= -50 && v <= -1) setDropPct(v) }} className="w-14 bg-transparent font-mono text-[13px] text-center focus:outline-none font-medium" style={{ color: COLORS.negative }} />
                <span className="text-[var(--color-text-tertiary)] font-mono text-[13px]">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Current Price</label>
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] font-mono text-[13px] px-3 py-2.5">${currentPrice.toFixed(2)}</div>
            </div>
            <div>
              <label className="label mb-1.5 block">Shares Held</label>
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] font-mono text-[13px] px-3 py-2.5">{sharesHeld}</div>
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">Active Hedge</label>
            {activeHedge ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-mono font-medium" style={{ borderColor: `${COLORS.positive}33`, backgroundColor: `${COLORS.positive}08`, color: COLORS.positive }}>
                {activeHedge.symbol} Put @ ${activeHedge.strike} — Exp {activeHedge.expiry}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-[var(--color-text-tertiary)] text-[12px] font-mono">
                No active hedge for {symbol}
              </div>
            )}
          </div>

          <button onClick={handleRun} disabled={running} className="w-full py-3 rounded-lg bg-[var(--color-btn)] text-[var(--color-btn-text)] font-semibold text-[13px] hover:opacity-90 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
            {running ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Simulating...
              </span>
            ) : 'Run Simulation'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard title="Without Hedge" color="danger" items={[
                  { label: 'New Price', value: `$${result.new_price.toFixed(2)}` },
                  { label: 'Portfolio Loss', value: `-$${Math.abs(result.unhedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, big: true },
                  { label: 'Total Damage', value: `$${Math.abs(result.unhedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                ]} />
                <ResultCard title="With Hedge" color="success" items={[
                  { label: 'Put Payout', value: `+$${result.put_payout.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Premium Cost', value: `-$${result.premium_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Net Loss', value: `$${Math.abs(result.hedged_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Money Saved', value: `$${result.money_saved.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, big: true },
                ]} />
              </div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 flex flex-col items-center">
                <div className="label mb-3 text-[var(--color-text-secondary)]">Capital Preservation Rate</div>
                <CprGauge value={result.cpr} />
                {result.cpr >= 0.6 && (
                  <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: COLORS.positive }}>
                    <span>✓</span> Target Met (≥60%)
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
                <div className="label mb-4">Loss Comparison</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} vertical={false} />
                      <XAxis dataKey="name" stroke="var(--color-text-tertiary)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v.toLocaleString()}`} width={70} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-bg-hover)' }} />
                      <Bar dataKey="loss" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {barData.map((_, idx) => <Cell key={idx} fill={idx === 0 ? COLORS.negative : COLORS.positive} />)}
                        <LabelList dataKey="loss" position="top" formatter={(v) => `$${Math.abs(Number(v)).toLocaleString('en-US', { minimumFractionDigits: 0 })}`} style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, fill: 'var(--color-text-primary)' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 14 6 10 10 12 18 4" />
                  <polyline points="14 4 18 4 18 8" />
                </svg>
              </div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)] mb-1">Run a simulation</div>
              <div className="text-[12px] text-[var(--color-text-secondary)] max-w-[220px]">Configure your scenario on the left, then hit Run Simulation to see results.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
