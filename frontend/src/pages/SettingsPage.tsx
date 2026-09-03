import { useState } from 'react'

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        backgroundColor: enabled ? 'var(--brand)' : 'var(--border)',
        borderColor: enabled ? 'var(--brand)' : 'var(--border)',
      }}
      className={`relative w-8 h-4 rounded-[2px] border transition-colors duration-100 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span
        style={{
          backgroundColor: enabled ? 'var(--bg)' : 'var(--text-faint)',
        }}
        className={`absolute top-[1px] left-[1px] w-3 h-3 rounded-[1px] transition-transform duration-100 ${
          enabled ? 'translate-x-3.5' : ''
        }`}
      />
    </button>
  )
}

function NumberInput({ value, onChange, min, max, step = 1, suffix = '%', disabled }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string; disabled?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="flex items-center gap-1 rounded-[2px] border px-2.5 py-1.5 focus-within:border-[var(--brand)] transition-colors"
    >
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-transparent font-mono text-[12px] text-[var(--text)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
      />
      <span className="text-[11px] text-[var(--text-faint)] font-mono shrink-0">{suffix}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [autoHedge, setAutoHedge] = useState(true)
  const [lowThreshold, setLowThreshold] = useState(2.0)
  const [medThreshold, setMedThreshold] = useState(5.0)
  const [highThreshold, setHighThreshold] = useState(10.0)

  const [putOffset, setPutOffset] = useState(5)
  const [expiryDays, setExpiryDays] = useState(14)
  const [maxPremium, setMaxPremium] = useState(500)
  const [monitorInterval, setMonitorInterval] = useState(10)
  const [idempotencyWindow, setIdempotencyWindow] = useState(30)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[16px] font-mono font-medium text-[var(--text)] mb-1">Terminal parameters & risk controls</h1>
        <p className="text-[12px] text-[var(--text-dim)]">Manage autonomous protective put triggers, drawdown thresholds, and Alpaca monitor agents.</p>
      </div>

      {/* Auto-Hedge Toggle Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-mono font-medium text-[var(--text)]">Autonomous hedging execution</div>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
              When enabled, Worker agent places 5% OTM protective puts automatically when threshold is breached.
            </p>
          </div>
          <Toggle enabled={autoHedge} onChange={() => setAutoHedge(p => !p)} />
        </div>
      </div>

      {/* Drawdown Thresholds Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4 space-y-3"
      >
        <span className="label block">Drawdown thresholds & severity tiers</span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label mb-1.5 block">Low threshold (nominal)</label>
            <NumberInput value={lowThreshold} onChange={setLowThreshold} min={0.5} max={medThreshold - 0.5} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)]" />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">telemetry log</span>
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">Medium threshold (elevated)</label>
            <NumberInput value={medThreshold} onChange={setMedThreshold} min={lowThreshold + 0.5} max={highThreshold - 0.5} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">warning alert</span>
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">High threshold (critical)</label>
            <NumberInput value={highThreshold} onChange={setHighThreshold} min={medThreshold + 0.5} max={50} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--negative)]" />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">trigger put order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hedge Parameters Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4 space-y-3"
      >
        <span className="label block">Protective put order parameters</span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label mb-1.5 block">Put strike offset (% OTM)</label>
            <NumberInput value={putOffset} onChange={setPutOffset} min={1} max={20} step={1} suffix="%" />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">5% below market price</span>
          </div>

          <div>
            <label className="label mb-1.5 block">Contract expiry window</label>
            <NumberInput value={expiryDays} onChange={setExpiryDays} min={1} max={90} step={1} suffix="days" />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Default 14-day DTE</span>
          </div>

          <div>
            <label className="label mb-1.5 block">Max premium allocation</label>
            <NumberInput value={maxPremium} onChange={setMaxPremium} min={10} max={5000} step={10} suffix="USD" />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Per single hedge</span>
          </div>
        </div>
      </div>

      {/* Agent & Idempotency Config */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4 space-y-3"
      >
        <span className="label block">Agent orchestration & idempotency guard</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Monitor poll interval</label>
            <NumberInput value={monitorInterval} onChange={setMonitorInterval} min={1} max={300} step={1} suffix="sec" />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Alpaca account snapshot polling</span>
          </div>

          <div>
            <label className="label mb-1.5 block">Idempotency deduplication window</label>
            <NumberInput value={idempotencyWindow} onChange={setIdempotencyWindow} min={5} max={300} step={5} suffix="sec" />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Prevents duplicate put orders</span>
          </div>
        </div>
      </div>
    </div>
  )
}
