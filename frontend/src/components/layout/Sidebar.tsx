import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const mainNav = [
  { to: '/dashboard', label: 'Portfolio', end: true, icon: (active: boolean) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <rect x="2" y="2" width="6" height="6" rx="1.5" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" />
    </svg>
  )},
  { to: '/dashboard/alerts', label: 'Alerts', icon: (active: boolean) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <path d="M13.5 6.75a4.5 4.5 0 10-9 0c0 5.25-2.25 6.75-2.25 6.75h13.5s-2.25-1.5-2.25-6.75" />
      <path d="M10.3 15.75a1.5 1.5 0 01-2.6 0" />
    </svg>
  )},
  { to: '/dashboard/hedges', label: 'Hedges', icon: (active: boolean) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <path d="M9 1.5L3 4.5v4.5c0 3.75 2.55 7.26 6 8.25 3.45-.99 6-4.5 6-8.25V4.5L9 1.5z" />
    </svg>
  )},
  { to: '/dashboard/stress-test', label: 'Stress Test', icon: (active: boolean) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <polyline points="2 13 6 9 10 11 16 5" />
      <polyline points="12 5 16 5 16 9" />
    </svg>
  )},
  { to: '/dashboard/logs', label: 'Logs', icon: (active: boolean) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V6L10.5 1.5z" />
      <polyline points="10.5 1.5 10.5 6 15 6" />
      <line x1="6" y1="9.75" x2="12" y2="9.75" />
      <line x1="6" y1="12.75" x2="10" y2="12.75" />
    </svg>
  )},
]

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M14.8 11.2a1.15 1.15 0 00.23 1.27l.04.04a1.4 1.4 0 11-1.98 1.98l-.04-.04a1.15 1.15 0 00-1.27-.23 1.15 1.15 0 00-.7 1.05v.12a1.4 1.4 0 01-2.8 0v-.06a1.15 1.15 0 00-.75-1.05 1.15 1.15 0 00-1.27.23l-.04.04a1.4 1.4 0 11-1.98-1.98l.04-.04a1.15 1.15 0 00.23-1.27 1.15 1.15 0 00-1.05-.7h-.12a1.4 1.4 0 010-2.8h.06a1.15 1.15 0 001.05-.75 1.15 1.15 0 00-.23-1.27l-.04-.04A1.4 1.4 0 115.8 3.75l.04.04a1.15 1.15 0 001.27.23h.06a1.15 1.15 0 00.7-1.05v-.12a1.4 1.4 0 012.8 0v.06a1.15 1.15 0 00.7 1.05 1.15 1.15 0 001.27-.23l.04-.04a1.4 1.4 0 111.98 1.98l-.04.04a1.15 1.15 0 00-.23 1.27v.06a1.15 1.15 0 001.05.7h.12a1.4 1.4 0 010 2.8h-.06a1.15 1.15 0 00-1.05.7z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-tertiary)]">
      <path d="M15.5 10.5a6.5 6.5 0 01-8-8 6.5 6.5 0 108 8z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-tertiary)]">
      <circle cx="9" cy="9" r="3.5" />
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.22 4.22l1.06 1.06M12.72 12.72l1.06 1.06M4.22 13.78l1.06-1.06M12.72 5.28l1.06-1.06" />
    </svg>
  )
}

export default function Sidebar() {
  const { theme, toggle } = useTheme()

  return (
    <aside className="w-[250px] shrink-0 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] h-screen sticky top-0 flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-center">
        <img src="/logo/hedgify.png" alt="Hedgify" className="h-8 w-auto max-w-full object-contain" />
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {mainNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[var(--color-bg-active)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0">{item.icon(isActive)}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3 space-y-1">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
        >
          <span className="flex-shrink-0">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-[var(--color-bg-active)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex-shrink-0"><SettingsIcon active={isActive} /></span>
              Settings
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
