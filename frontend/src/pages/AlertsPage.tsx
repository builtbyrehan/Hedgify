import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import StatusBadge from '../components/shared/StatusBadge'
import EmptyState from '../components/shared/EmptyState'
import Dropdown from '../components/shared/Dropdown'
import type { Alert } from '../types'

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    if (Date.now() - d.getTime() < 24 * 3600 * 1000) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function drawdownSeverity(dd: number) {
  if (dd < 2) return { color: 'var(--positive)', label: 'nominal' }
  if (dd < 5) return { color: 'var(--warning)', label: 'elevated' }
  return { color: 'var(--negative)', label: 'critical' }
}

export default function AlertsPage() {
  const { alerts } = useDashboard()

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

  const statItems = [
    { label: 'Total alerts', value: stats.total, color: 'text-[var(--text)]' },
    { label: 'Processed', value: stats.processed, color: 'text-[var(--positive)]' },
    { label: 'Skipped', value: stats.skipped, color: 'text-[var(--warning)]', sub: 'Idempotency guard active' },
    { label: 'Failed', value: stats.failed, color: 'text-[var(--negative)]' },
  ]

  return (
    <div className="space-y-6">
      {/* Metric Summary Strip */}
      <div
        style={{ borderColor: 'var(--border-faint)', backgroundColor: 'var(--surface)' }}
        className="border rounded-[2px] grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-faint)]"
      >
        {statItems.map((s) => (
          <div key={s.label} className="p-4 flex flex-col justify-between">
            <span className="label">{s.label}</span>
            <div className={`mt-2 text-[20px] font-mono font-medium tabular-nums ${s.color}`}>
              {s.value}
            </div>
            {s.sub ? (
              <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1">{s.sub}</span>
            ) : (
              <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1">all time</span>
            )}
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="label mb-1.5 block">Status</label>
          <Dropdown
            value={statusFilter}
            onChange={setStatusFilter}
            size="sm"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'fired', label: 'Fired' },
              { value: 'processed', label: 'Processed' },
              { value: 'skipped', label: 'Skipped' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        </div>

        <div className="w-36">
          <label className="label mb-1.5 block">Symbol</label>
          <Dropdown
            value={symbolFilter}
            onChange={setSymbolFilter}
            size="sm"
            options={[
              { value: 'all', label: 'All symbols' },
              ...symbols.map(s => ({ value: s, label: s })),
            ]}
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setSortDesc(p => !p)}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] border font-mono text-[11px] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            <span>Time: {sortDesc ? 'Newest first' : 'Oldest first'}</span>
            <span className="text-[10px]">{sortDesc ? '↓' : '↑'}</span>
          </button>
        </div>
      </div>

      {/* Alerts Table Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="label">Alert event log</span>
          <span className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
            {filteredAlerts.length} filtered
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <EmptyState context="alerts" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr style={{ borderColor: 'var(--border-faint)' }} className="border-b">
                  <th className="label pb-2 pr-4 font-normal">Timestamp</th>
                  <th className="label pb-2 pr-4 font-normal">Symbol</th>
                  <th className="label pb-2 pr-4 font-normal">Drawdown</th>
                  <th className="label pb-2 pr-4 font-normal">Status</th>
                  <th className="label pb-2 pr-4 font-normal">Reason / details</th>
                  <th className="label pb-2 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-faint)' }} className="divide-y divide-[var(--border-faint)]">
                {filteredAlerts.map(alert => {
                  const dd = alert.drawdown * 100
                  const sev = drawdownSeverity(dd)
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => openDetail(alert)}
                      className="hover:bg-[var(--surface-raised)] transition-colors duration-100 cursor-pointer"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="font-mono text-[12px] text-[var(--text)] tabular-nums">{formatTime(alert.timestamp)}</div>
                        <div className="font-mono text-[10px] text-[var(--text-faint)] tabular-nums">{timeAgo(alert.timestamp)}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-[13px] text-[var(--text)]">{alert.symbol}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-mono text-[12px] font-medium tabular-nums" style={{ color: sev.color }}>
                          {dd.toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-faint)] lowercase">{sev.label}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-[11px] text-[var(--text-dim)] truncate max-w-[280px] block">
                          {(alert as any).reason || (alert.status === 'processed' ? 'Protective put ordered' : 'Drawdown monitored')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(alert) }}
                          className="font-mono text-[11px] text-[var(--brand)] hover:underline"
                        >
                          inspect
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {modalOpen && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              className="w-full max-w-lg border rounded-[2px] p-5 space-y-4 shadow-none"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-faint)] pb-3">
                <div>
                  <span className="label">Alert inspector</span>
                  <div className="text-[14px] font-mono font-medium text-[var(--text)] mt-0.5">
                    {selectedAlert.symbol} — {selectedAlert.status}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-[var(--text-faint)] hover:text-[var(--text)] font-mono text-sm px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-3 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[2px]">
                  <span className="label block mb-1">Drawdown breached</span>
                  <span className="text-[14px] font-medium text-[var(--negative)] tabular-nums">
                    {(selectedAlert.drawdown * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="p-3 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[2px]">
                  <span className="label block mb-1">Status</span>
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <div className="p-3 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[2px]">
                  <span className="label block mb-1">Timestamp</span>
                  <span className="text-[var(--text)] tabular-nums">{formatDate(selectedAlert.timestamp)} {formatTime(selectedAlert.timestamp)}</span>
                </div>
                <div className="p-3 bg-[var(--surface)] border border-[var(--border-faint)] rounded-[2px]">
                  <span className="label block mb-1">Relative time</span>
                  <span className="text-[var(--text-dim)] tabular-nums">{timeAgo(selectedAlert.timestamp)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setRawJsonOpen(p => !p)}
                  className="text-[11px] font-mono text-[var(--brand)] hover:underline flex items-center gap-1"
                >
                  <span>{rawJsonOpen ? '▼ Hide raw payload' : '▶ View raw payload'}</span>
                </button>
                {rawJsonOpen && (
                  <pre
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-faint)' }}
                    className="mt-2 p-3 border rounded-[2px] text-[10px] font-mono text-[var(--text-dim)] overflow-x-auto"
                  >
                    {JSON.stringify(selectedAlert, null, 2)}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
