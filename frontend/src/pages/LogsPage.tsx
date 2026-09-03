import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../context/DashboardContext'
import EmptyState from '../components/shared/EmptyState'
import Dropdown from '../components/shared/Dropdown'
import type { LogEntry } from '../types'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch { return '--:--:--' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const severityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  info: { color: 'var(--text-dim)', bg: 'color-mix(in srgb, var(--text-faint) 10%, transparent)', dot: 'var(--text-faint)' },
  warning: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)', dot: 'var(--warning)' },
  error: { color: 'var(--negative)', bg: 'color-mix(in srgb, var(--negative) 10%, transparent)', dot: 'var(--negative)' },
}

const agentConfig: Record<string, { color: string; border: string }> = {
  Monitor: { color: 'var(--text-dim)', border: 'var(--border-faint)' },
  Executor: { color: 'var(--brand)', border: 'color-mix(in srgb, var(--brand) 30%, transparent)' },
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'mock-1', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), agent: 'Monitor', event_type: 'Portfolio Check', message: 'Portfolio drawdown at 1.82%, below 2.00% threshold. No action required.', severity: 'info' },
  { id: 'mock-2', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), agent: 'Monitor', event_type: 'Drawdown Alert', message: 'AAPL drawdown breached 2.00% threshold (2.34%). Alert fired.', severity: 'warning' },
  { id: 'mock-3', timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(), agent: 'Executor', event_type: 'Hedge Placed', message: 'Protective put order filled: AAPL 5% OTM, 14-day expiry, $48.00 premium.', severity: 'info' },
  { id: 'mock-4', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), agent: 'Executor', event_type: 'Order Failed', message: 'Broker rejected TSLA put order: insufficient buying power in paper account.', severity: 'error' },
  { id: 'mock-5', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), agent: 'Monitor', event_type: 'Idempotency Guard', message: 'Duplicate alert for AAPL skipped (last processed 45s ago). Guard active.', severity: 'warning' },
]

export default function LogsPage() {
  const { logs: contextLogs } = useDashboard()
  const logs = contextLogs.length > 0 ? contextLogs : MOCK_LOGS

  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    if (agentFilter !== 'all') result = result.filter(l => l.agent === agentFilter)
    if (severityFilter !== 'all') result = result.filter(l => l.severity === severityFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l => l.message.toLowerCase().includes(q) || l.event_type.toLowerCase().includes(q) || l.agent.toLowerCase().includes(q))
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return result
  }, [logs, agentFilter, severityFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label className="label mb-1.5 block">Agent</label>
          <Dropdown
            value={agentFilter}
            onChange={setAgentFilter}
            size="sm"
            options={[
              { value: 'all', label: 'All agents' },
              { value: 'Monitor', label: 'Monitor' },
              { value: 'Executor', label: 'Executor' },
            ]}
          />
        </div>
        <div className="w-36">
          <label className="label mb-1.5 block">Severity</label>
          <Dropdown
            value={severityFilter}
            onChange={setSeverityFilter}
            size="sm"
            options={[
              { value: 'all', label: 'All severities' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label mb-1.5 block">Search logs</label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="4.5" />
              <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword..."
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="w-full rounded-[2px] border font-mono text-[11px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[var(--brand)] transition-colors placeholder:text-[var(--text-faint)]"
            />
          </div>
        </div>
      </div>

      {/* Logs Panel */}
      <div
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="label">System event telemetry</span>
          <span className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
            {filteredLogs.length} events
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState context="logs" />
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-[var(--border-faint)]" />
            <div className="space-y-1">
              <AnimatePresence>
                {filteredLogs.map((log, i) => {
                  const severity = severityConfig[log.severity] || severityConfig.info
                  const agent = agentConfig[log.agent] || agentConfig.Monitor

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1, delay: i * 0.01 }}
                      className="relative pl-7 py-2.5 hover:bg-[var(--surface-raised)] rounded-[2px] transition-colors"
                    >
                      <div
                        style={{ backgroundColor: severity.dot }}
                        className="absolute left-[4px] top-[14px] w-[7px] h-[7px] rounded-full z-10"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <div className="flex-shrink-0 sm:w-[100px]">
                          <div className="font-mono text-[var(--text)] text-[11px] tabular-nums">{formatTime(log.timestamp)}</div>
                          <div className="font-mono text-[var(--text-faint)] text-[10px] tabular-nums">{timeAgo(log.timestamp)}</div>
                        </div>

                        <div className="flex-shrink-0">
                          <span
                            style={{ color: agent.color, borderColor: agent.border }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] border text-[10px] font-mono"
                          >
                            {log.agent}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[var(--text)] font-mono text-[11px] font-medium">{log.event_type}</span>
                            <span
                              style={{ color: severity.color, backgroundColor: severity.bg }}
                              className="inline-flex items-center px-1.5 py-[1px] rounded-[2px] text-[9px] font-mono lowercase"
                            >
                              {log.severity}
                            </span>
                          </div>
                          <div className="text-[var(--text-dim)] font-mono text-[11px] leading-relaxed">{log.message}</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
