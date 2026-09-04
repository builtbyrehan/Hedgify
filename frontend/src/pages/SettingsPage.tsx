import { useEffect, useState } from 'react'
import { fetchConfig, updateConfig } from '../services/api'

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
        style={{ backgroundColor: enabled ? 'var(--bg)' : 'var(--text-faint)' }}
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
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
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

// UI shows human units (percent); backend stores fractions (0.02, 0.05)
type ConfigState = {
  autonomous_hedging: boolean
  drawdown_threshold: number // %
  otm_buffer: number         // %
  expiry_days: number
  max_premium: number
  poll_interval_seconds: number
}

const DEFAULTS: ConfigState = {
  autonomous_hedging: true,
  drawdown_threshold: 2,
  otm_buffer: 5,
  expiry_days: 14,
  max_premium: 500,
  poll_interval_seconds: 10,
}

export default function SettingsPage() {
  const [cfg, setCfg] = useState<ConfigState>(DEFAULTS)
  const [saved, setSaved] = useState<ConfigState>(DEFAULTS) // last-persisted snapshot
  const [online, setOnline] = useState<boolean | null>(null) // null = loading
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await fetchConfig()
    if (!data) { setOnline(false); return }
    setOnline(true)
    const next: ConfigState = {
      autonomous_hedging: data.autonomous_hedging ?? true,
      drawdown_threshold: Math.round((data.drawdown_threshold ?? 0.02) * 1000) / 10,
      otm_buffer: Math.round((data.otm_buffer ?? 0.05) * 1000) / 10,
      expiry_days: data.expiry_days ?? 14,
      max_premium: data.max_premium ?? 500,
      poll_interval_seconds: data.poll_interval_seconds ?? 10,
    }
    setCfg(next)
    setSaved(next)
  }

  async function save() {
    setSaving(true)
    setToast(null)
    const res = await updateConfig({
      autonomous_hedging: cfg.autonomous_hedging,
      drawdown_threshold: cfg.drawdown_threshold / 100,
      otm_buffer: cfg.otm_buffer / 100,
      expiry_days: cfg.expiry_days,
      max_premium: cfg.max_premium,
      poll_interval_seconds: cfg.poll_interval_seconds,
    })
    setSaving(false)
    if (res.ok) {
      setSaved(cfg)
      setToast({ type: 'ok', msg: 'Saved — agents apply changes on their next loop.' })
    } else {
      setToast({ type: 'err', msg: res.error ?? 'Save failed' })
    }
    setTimeout(() => setToast(null), 6000)
  }

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved)
  const set = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) =>
    setCfg(p => ({ ...p, [key]: value }))

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-mono font-medium text-[var(--text)] mb-1">Terminal parameters & risk controls</h1>
          <p className="text-[12px] text-[var(--text-dim)]">Live runtime configuration — persisted to the database, read by agents every loop.</p>
        </div>
        {online !== null && (
          <span
            style={{
              color: online ? 'var(--positive)' : 'var(--warning)',
              borderColor: online ? 'var(--positive)' : 'var(--warning)',
            }}
            className="shrink-0 border rounded-[2px] px-2 py-1 text-[10px] font-mono"
          >
            {online ? '● LIVE CONFIG' : '● BACKEND OFFLINE'}
          </span>
        )}
      </div>

      {/* Auto-Hedge Kill Switch — LIVE */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-mono font-medium text-[var(--text)]">Autonomous hedging execution</div>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
              When enabled, the Worker agent places protective puts automatically when the threshold is breached. When disabled, alerts are acknowledged and skipped — no orders.
            </p>
          </div>
          <Toggle enabled={cfg.autonomous_hedging} onChange={() => set('autonomous_hedging', !cfg.autonomous_hedging)} disabled={online === false} />
        </div>
      </div>

      {/* Drawdown Trigger — single live threshold */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-3">
        <span className="label block">Drawdown trigger threshold</span>
        <div className="max-w-[220px]">
          <NumberInput value={cfg.drawdown_threshold} onChange={v => set('drawdown_threshold', v)} min={0.1} max={50} step={0.5} suffix="%" disabled={online === false} />
        </div>
        <p className="text-[10px] font-mono text-[var(--text-faint)]">
          Monitor fires a hedge alert the moment portfolio drawdown from peak crosses this value.
        </p>
      </div>

      {/* Put Parameters — LIVE */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-3">
        <span className="label block">Protective put order parameters</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label mb-1.5 block">Put strike offset (% OTM)</label>
            <NumberInput value={cfg.otm_buffer} onChange={v => set('otm_buffer', v)} min={1} max={25} step={0.5} suffix="%" disabled={online === false} />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Strike = price × (1 − offset)</span>
          </div>
          <div>
            <label className="label mb-1.5 block">Contract expiry window</label>
            <NumberInput value={cfg.expiry_days} onChange={v => set('expiry_days', v)} min={1} max={90} step={1} suffix="days" disabled={online === false} />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">DTE from order date</span>
          </div>
          <div>
            <label className="label mb-1.5 block">Max premium allocation</label>
            <NumberInput value={cfg.max_premium} onChange={v => set('max_premium', v)} min={10} max={10000} step={10} suffix="USD" disabled={online === false} />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Per single hedge — rejects above</span>
          </div>
        </div>
      </div>

      {/* Agent orchestration + honest idempotency */}
      <div style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-[2px] p-4 space-y-3">
        <span className="label block">Agent orchestration & idempotency guard</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Monitor poll interval</label>
            <NumberInput value={cfg.poll_interval_seconds} onChange={v => set('poll_interval_seconds', v)} min={5} max={3600} step={1} suffix="sec" disabled={online === false} />
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">Applied on the next sleep cycle — no restart needed</span>
          </div>
          <div>
            <label className="label mb-1.5 block">Idempotency guard</label>
            <div style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }} className="border rounded-[2px] px-2.5 py-[7px] font-mono text-[11px] text-[var(--text)]">
              state-based · always active
            </div>
            <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">While an active hedge exists for a symbol, duplicate alerts are skipped automatically.</span>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || saving || online === false}
          style={{ backgroundColor: 'var(--brand)', color: 'var(--bg)' }}
          className="py-2 px-5 rounded-[2px] font-mono text-[12px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving...' : dirty ? 'Save changes' : 'Saved ✓'}
        </button>
        {dirty && (
          <button
            onClick={() => setCfg(saved)}
            className="py-2 px-4 rounded-[2px] font-mono text-[12px] border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            Discard
          </button>
        )}
        {toast && (
          <span className="text-[11px] font-mono" style={{ color: toast.type === 'ok' ? 'var(--positive)' : 'var(--negative)' }}>
            {toast.type === 'ok' ? '✓ ' : '✕ '}{toast.msg}
          </span>
        )}
      </div>
    </div>
  )
}