import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'
import Dropdown from '../components/shared/Dropdown'
import type { Alert } from '../types'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function drawdownSeverity(dd: number) {
  if (dd < 5) return { color: 'var(--color-severity-low)', label: 'Low' }
  if (dd < 15) return { color: 'var(--color-severity-med)', label: 'Medium' }
  return { color: 'var(--color-severity-high)', label: 'High' }
}

export default function AlertsPage() {
  const { alerts, portfolio } = useDashboard()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [sortDesc, setSortDesc] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rawJsonOpen, setRawJsonOpen] = useState(false)

  const stats = useMemo(() => {
    const total = alerts.length
    const processed = alerts.filter(a => a.status === 'processed').length
    const skipped = alerts.filter(a => a.status === 'skipped').length
    const failed = alerts.filter(a => a.status === 'failed').length
    return { total, processed, skipped, failed }
  }, [alerts])

  const symbols = useMemo(() => {
    const set = new Set(alerts.map(a => a.symbol))
    return Array.from(set).sort()
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    let result = [...alerts]
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter)
    if (symbolFilter !== 'all') result = result.filter(a => a.symbol === symbolFilter)
    result.sort((a, b) => {
      const da = new Date(a.timestamp).getTime()
      const db = new Date(b.timestamp).getTime()
      return sortDesc ? db - da : da - db
    })
    return result
  }, [alerts, statusFilter, symbolFilter, sortDesc])

  function openDetail(alert: Alert) {
    setSelectedAlert(alert)
    setModalOpen(true)
    setRawJsonOpen(false)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedAlert(null)
    setRawJsonOpen(false)
  }

  const statCards = [
    { label: 'Total Alerts', value: stats.total, color: 'text-[var(--color-text-primary)]' },
    { label: 'Processed', value: stats.processed, color: 'text-[var(--color-positive)]' },
    { label: 'Skipped', value: stats.skipped, color: 'text-[var(--color-warning)]', sub: 'Idempotency guard active' },
    { label: 'Failed', value: stats.failed, color: 'text-[var(--color-danger)]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="card p-4">
            <div className="label mb-1.5">{s.label}</div>
            <div className={`text-[20px] font-semibold font-mono tabular-nums ${s.color}`}>{s.value}</div>
            {s.sub && <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label mb-1.5 block">Status</label>
          <Dropdown value={statusFilter} onChange={setStatusFilter} size="sm" options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'fired', label: 'Fired' },
            { value: 'processed', label: 'Processed' },
            { value: 'skipped', label: 'Skipped' },
            { value: 'failed', label: 'Failed' },
          ]} />
        </div>
        <div>
          <label className="label mb-1.5 block">Symbol</label>
          <Dropdown value={symbolFilter} onChange={setSymbolFilter} size="sm" options={[
            { value: 'all', label: 'All Symbols' },
            ...symbols.map(s => ({ value: s, label: s })),
          ]} />
        </div>
        <div className="ml-auto">
          <label className="label mb-1.5 block">Sort</label>
          <button onClick={() => setSortDesc(prev => !prev)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-mono text-[12px] px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-1.5">
            <span>Time</span>
            <span className="text-[var(--color-text-primary)]">{sortDesc ? '↓' : '↑'}</span>
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="label mb-4">Alert History</div>
        {filteredAlerts.length === 0 ? (
          <EmptyState context="alerts" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left label pb-2.5 pr-4 font-normal">ID</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Time</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Symbol</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Drawdown</th>
                  <th className="text-left label pb-2.5 pr-4 font-normal">Status</th>
                  <th className="text-left label pb-2.5 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAlerts.map((alert, i) => {
                    const ddPct = (alert.drawdown ?? 0) * 100
                    const sev = drawdownSeverity(ddPct)
                    return (
                      <motion.tr key={alert.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, delay: i * 0.015 }} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-[var(--color-text-tertiary)] text-[12px]">
                          {typeof alert.id === 'string' ? alert.id.slice(0, 12) : `#${alert.id}`}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="font-mono text-[var(--color-text-secondary)] text-[12px]">{formatTime(alert.timestamp)}</div>
                          <div className="font-mono text-[var(--color-text-tertiary)] text-[11px]">{timeAgo(alert.timestamp)}</div>
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-[var(--color-text-primary)]">{alert.symbol}</td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono font-medium" style={{ color: sev.color }}>
                            -{ddPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 pr-4"><StatusBadge status={alert.status} /></td>
                        <td className="py-2.5">
                          <button onClick={() => openDetail(alert)} className="text-[var(--color-text-secondary)] text-[12px] font-medium hover:text-[var(--color-text-primary)] transition-colors">
                            View Details
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && selectedAlert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/20 z-50" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ duration: 0.2 }} className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-text-primary)]">Alert Details</div>
                  <div className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{selectedAlert.symbol} — {formatDate(selectedAlert.timestamp)}</div>
                </div>
                <button onClick={closeModal} className="w-7 h-7 rounded-md bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] transition-colors text-[13px]">
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                    <div className="label mb-1">Alert ID</div>
                    <div className="text-[12px] font-mono text-[var(--color-text-primary)] break-all">
                      {typeof selectedAlert.id === 'string' ? selectedAlert.id : `#${selectedAlert.id}`}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                    <div className="label mb-1">Triggered At</div>
                    <div className="text-[12px] font-mono text-[var(--color-text-primary)]">{formatTime(selectedAlert.timestamp)}</div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">{timeAgo(selectedAlert.timestamp)}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                    <div className="label mb-1">Portfolio Value</div>
                    <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                      ${(portfolio?.portfolio_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                    <div className="label mb-1">Peak Value</div>
                    <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                      ${(portfolio?.peak_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {(() => {
                  const ddPct = (selectedAlert.drawdown ?? 0) * 100
                  const sev = drawdownSeverity(ddPct)
                  return (
                    <div className="rounded-lg border p-4" style={{ borderColor: `${sev.color}33`, backgroundColor: `${sev.color}08` }}>
                      <div className="label mb-1" style={{ color: sev.color }}>Drawdown at Trigger</div>
                      <div className="text-[22px] font-semibold font-mono tabular-nums" style={{ color: sev.color }}>
                        -{ddPct.toFixed(2)}%
                      </div>
                      <div className="text-[11px] text-[var(--color-text-tertiary)] mt-1">{sev.label} severity — threshold breached</div>
                    </div>
                  )
                })()}

                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                  <div>
                    <div className="label mb-1">Status</div>
                    <StatusBadge status={selectedAlert.status} />
                  </div>
                  <div className="text-right">
                    <div className="label mb-1">Symbol</div>
                    <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">{selectedAlert.symbol}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                  <div className="label mb-2">Hedge Result</div>
                  {selectedAlert.status === 'processed' ? (
                    <div className="flex items-center gap-2 text-[var(--color-positive)] text-[12px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-positive)]" />
                      Protective put placed — 5% OTM, 14-day expiry
                    </div>
                  ) : selectedAlert.status === 'skipped' ? (
                    <div className="flex items-center gap-2 text-[var(--color-warning)] text-[12px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
                      Idempotency guard — duplicate alert skipped
                    </div>
                  ) : selectedAlert.status === 'failed' ? (
                    <div className="flex items-center gap-2 text-[var(--color-danger)] text-[12px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)]" />
                      Order failed — broker rejected or insufficient funds
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] text-[12px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" />
                      Pending processing...
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)]">
                  <button onClick={() => setRawJsonOpen(prev => !prev)} className="w-full flex items-center justify-between px-3 py-2.5 label hover:text-[var(--color-text-primary)] transition-colors">
                    <span>Raw JSON</span>
                    <span className="text-[var(--color-text-tertiary)]">{rawJsonOpen ? '▾' : '▸'}</span>
                  </button>
                  <AnimatePresence>
                    {rawJsonOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <pre className="px-3 pb-3 font-mono text-[11px] text-[var(--color-text-secondary)] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedAlert, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
