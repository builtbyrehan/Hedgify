import { useDashboard } from '../../context/DashboardContext'

export default function TopNav() {
  const { wsConnected } = useDashboard()

  return (
    <header className="h-12 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[var(--color-success)] pulse-dot' : 'bg-[var(--color-danger)]'}`} />
          <span className="text-[11px] font-semibold text-[var(--color-text-primary)] tracking-wide uppercase">
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        <span className="text-[12px] text-[var(--color-text-tertiary)] hidden sm:inline">Markets open</span>
      </div>
    </header>
  )
}
