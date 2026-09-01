import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import Dropdown from '../components/shared/Dropdown'

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled} className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${enabled ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[var(--color-bg-card)] transition-transform duration-150 ${enabled ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function NumberInput({ value, onChange, min, max, step = 1, suffix = '%', disabled }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 focus-within:border-[var(--color-text-primary)] transition-colors">
      <input type="number" value={value} min={min} max={max} step={step} disabled={disabled} onChange={e => onChange(Number(e.target.value))} className="w-full bg-transparent font-mono text-[13px] text-[var(--color-text-primary)] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
      <span className="text-[12px] text-[var(--color-text-tertiary)] font-mono shrink-0">{suffix}</span>
    </div>
  )
}

export default function SettingsPage() {
  const { portfolio } = useDashboard()

  const [autoHedge, setAutoHedge] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [webhookEnabled, setWebhookEnabled] = useState(false)

  const [lowThreshold, setLowThreshold] = useState(5)
  const [medThreshold, setMedThreshold] = useState(10)
  const [highThreshold, setHighThreshold] = useState(15)

  const [putOffset, setPutOffset] = useState(5)
  const [expiryDays, setExpiryDays] = useState(14)
  const [maxPremium, setMaxPremium] = useState(500)
  const [maxDailyHedges, setMaxDailyHedges] = useState(3)

  const [monitorInterval, setMonitorInterval] = useState(60)
  const [idempotencyWindow, setIdempotencyWindow] = useState(30)
  const [retryAttempts, setRetryAttempts] = useState(3)

  const [marketHoursOnly, setMarketHoursOnly] = useState(true)
  const [extendedHours, setExtendedHours] = useState(false)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-1">Settings</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">Configure hedge parameters, alert thresholds, and agent behavior.</p>
      </div>

      {/* Auto-Hedge */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="label">Auto-Hedge</div>
          <Toggle enabled={autoHedge} onChange={() => setAutoHedge(p => !p)} />
        </div>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">When enabled, protective puts are placed automatically when drawdown thresholds are breached.</p>
      </div>

      {/* Drawdown Thresholds */}
      <div className="card p-5 space-y-4">
        <div className="label">Drawdown Thresholds</div>
        <p className="text-[12px] text-[var(--color-text-tertiary)] -mt-2">Define severity tiers for drawdown alerts. Each tier triggers different actions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Low (Info)</label>
            <NumberInput value={lowThreshold} onChange={setLowThreshold} min={0.5} max={medThreshold - 0.5} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-severity-low)' }} />
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Log only</span>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Medium (Warning)</label>
            <NumberInput value={medThreshold} onChange={setMedThreshold} min={lowThreshold + 0.5} max={highThreshold - 0.5} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-severity-med)' }} />
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Send alert</span>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">High (Critical)</label>
            <NumberInput value={highThreshold} onChange={setHighThreshold} min={medThreshold + 0.5} max={50} step={0.5} />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-severity-high)' }} />
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Auto-hedge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hedge Parameters */}
      <div className="card p-5 space-y-4">
        <div className="label">Hedge Parameters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Put Offset (% OTM)</label>
            <NumberInput value={putOffset} onChange={setPutOffset} min={1} max={20} step={1} suffix="%" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Strike price below current market</div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Expiry (days)</label>
            <NumberInput value={expiryDays} onChange={setExpiryDays} min={1} max={90} step={1} suffix="days" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Options contract duration</div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Max Premium per Hedge</label>
            <NumberInput value={maxPremium} onChange={setMaxPremium} min={50} max={5000} step={50} suffix="$" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Premium budget cap per order</div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Max Daily Hedges</label>
            <NumberInput value={maxDailyHedges} onChange={setMaxDailyHedges} min={1} max={10} step={1} suffix="orders" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Prevent over-hedging in volatile days</div>
          </div>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="card p-5 space-y-4">
        <div className="label">Agent Configuration</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Monitor Interval</label>
            <Dropdown value={String(monitorInterval)} onChange={v => setMonitorInterval(Number(v))} options={[{ value: '30', label: '30 seconds' }, { value: '60', label: '60 seconds' }, { value: '120', label: '2 minutes' }, { value: '300', label: '5 minutes' }]} />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Portfolio check frequency</div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Idempotency Window</label>
            <NumberInput value={idempotencyWindow} onChange={setIdempotencyWindow} min={10} max={300} step={10} suffix="sec" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Duplicate alert cooldown</div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Retry Attempts</label>
            <NumberInput value={retryAttempts} onChange={setRetryAttempts} min={0} max={5} step={1} suffix="x" />
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Failed order retries</div>
          </div>
        </div>
      </div>

      {/* Trading Hours */}
      <div className="card p-5 space-y-4">
        <div className="label">Trading Hours</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)]">Market Hours Only</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">Only place hedges during 9:30 AM – 4:00 PM ET</div>
            </div>
            <Toggle enabled={marketHoursOnly} onChange={() => { setMarketHoursOnly(p => !p); if (!marketHoursOnly) setExtendedHours(false) }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)]">Extended Hours</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">Also trade during pre-market (4:00–9:30 AM) and after-hours (4:00–8:00 PM)</div>
            </div>
            <Toggle enabled={extendedHours} onChange={() => setExtendedHours(p => !p)} disabled={!marketHoursOnly} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <div className="label">Notifications</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)]">Email Alerts</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">Receive email when hedges are placed or thresholds breached</div>
            </div>
            <Toggle enabled={emailAlerts} onChange={() => setEmailAlerts(p => !p)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--color-text-primary)]">Webhook</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">POST event payloads to an external endpoint</div>
            </div>
            <Toggle enabled={webhookEnabled} onChange={() => setWebhookEnabled(p => !p)} />
          </div>
          {webhookEnabled && (
            <div>
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">Webhook URL</label>
              <input type="url" placeholder="https://your-api.com/webhook" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-[var(--color-text-primary)] transition-colors placeholder:text-[var(--color-text-tertiary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="card p-5 space-y-4">
        <div className="label">Portfolio Summary</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1">Current Value</div>
            <div className="text-[14px] font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">
              ${(portfolio?.portfolio_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1">Peak Value</div>
            <div className="text-[14px] font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">
              ${(portfolio?.peak_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1">Drawdown</div>
            <div className="text-[14px] font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">
              {((portfolio?.drawdown ?? 0) * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1">Cash Balance</div>
            <div className="text-[14px] font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">
              $50,000.00
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pb-8">
        <div className="text-[12px] text-[var(--color-text-tertiary)]">Settings are saved locally and applied on next check cycle.</div>
        <button className="px-5 py-2 rounded-lg bg-[var(--color-btn)] text-[var(--color-btn-text)] text-[13px] font-semibold hover:opacity-90 active:scale-[0.99] transition-all duration-150">
          Save Changes
        </button>
      </div>
    </div>
  )
}
