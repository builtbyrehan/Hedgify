import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const mainNav = [
  {
    to: '/dashboard',
    label: 'Portfolio',
    end: true,
    icon: (active: boolean) => (
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="10" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="10" width="6" height="6" rx="1" />
        <rect x="10" y="10" width="6" height="6" rx="1" />
      </svg>
    )
  },
  {
    to: '/dashboard/alerts',
    label: 'Alerts',
    icon: (active: boolean) => (
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
        <path d="M13.5 6.75a4.5 4.5 0 10-9 0c0 5.25-2.25 6.75-2.25 6.75h13.5s-2.25-1.5-2.25-6.75" />
        <path d="M10.3 15.75a1.5 1.5 0 01-2.6 0" />
      </svg>
    )
  },
  {
    to: '/dashboard/hedges',
    label: 'Hedges',
    icon: (active: boolean) => (
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
        <path d="M9 1.5L3 4.5v4.5c0 3.75 2.55 7.26 6 8.25 3.45-.99 6-4.5 6-8.25V4.5L9 1.5z" />
      </svg>
    )
  },
  {
    to: '/dashboard/stress-test',
    label: 'Stress Test',
    icon: (active: boolean) => (
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
        <polyline points="2 13 6 9 10 11 16 5" />
        <polyline points="12 5 16 5 16 9" />
      </svg>
    )
  },
  {
    to: '/dashboard/logs',
    label: 'Logs',
    icon: (active: boolean) => (
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
        <path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V6L10.5 1.5z" />
        <polyline points="10.5 1.5 10.5 6 15 6" />
        <line x1="6" y1="9.75" x2="12" y2="9.75" />
        <line x1="6" y1="12.75" x2="10" y2="12.75" />
      </svg>
    )
  },
]

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-[var(--text-faint)]'}>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M14.8 11.2a1.15 1.15 0 00.23 1.27l.04.04a1.4 1.4 0 11-1.98 1.98l-.04-.04a1.15 1.15 0 00-1.27-.23 1.15 1.15 0 00-.7 1.05v.12a1.4 1.4 0 01-2.8 0v-.06a1.15 1.15 0 00-.75-1.05 1.15 1.15 0 00-1.27.23l-.04.04a1.4 1.4 0 11-1.98-1.98l.04-.04a1.15 1.15 0 00.23-1.27 1.15 1.15 0 00-1.05-.7h-.12a1.4 1.4 0 010-2.8h.06a1.15 1.15 0 001.05-.75 1.15 1.15 0 00-.23-1.27l-.04-.04A1.4 1.4 0 115.8 3.75l.04.04a1.15 1.15 0 001.27.23h.06a1.15 1.15 0 00.7-1.05v-.12a1.4 1.4 0 012.8 0v.06a1.15 1.15 0 00.7 1.05 1.15 1.15 0 001.27-.23l.04-.04a1.4 1.4 0 111.98 1.98l-.04.04a1.15 1.15 0 00-.23 1.27v.06a1.15 1.15 0 001.05.7h.12a1.4 1.4 0 010 2.8h-.06a1.15 1.15 0 00-1.05.7z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3.5" />
      <path d="M9 1.5v1.5M9 15v1.5M1.5 9H3M15 9h1.5M3.7 3.7l1.1 1.1M13.2 13.2l1.1 1.1M3.7 14.3l1.1-1.1M13.2 4.8l1.1-1.1" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 9.75A6.75 6.75 0 118.25 2.25a5.25 5.25 0 007.5 7.5z" />
    </svg>
  )
}

export default function Sidebar() {
  const { theme, toggle } = useTheme()

  return (
    <aside
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      className="w-[230px] shrink-0 border-r h-screen sticky top-0 flex flex-col justify-between select-none transition-colors duration-150"
    >
      <div>
        {/* Logo & Terminal Header */}
        <div
          style={{ borderColor: 'var(--border-faint)' }}
          className="h-14 px-4 flex items-center justify-between border-b"
        >
          <div className="flex items-center">
            <img
              src="/logo/hedgify.png"
              alt="Hedgify"
              className="h-6 w-auto max-h-6 max-w-[140px] object-contain"
            />
          </div>
          <span
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
              color: 'var(--text-faint)',
            }}
            className="text-[9px] font-mono border px-1.5 py-0.5 rounded-[2px] tracking-wider uppercase"
          >
            v1.0
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-0.5">
          {mainNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors duration-100 rounded-[2px] ${
                  isActive
                    ? 'bg-[var(--surface-raised)] text-[var(--text)] font-semibold border-l-2 border-[var(--brand)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] border-l-2 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex-shrink-0">{item.icon(isActive)}</span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Controls: Theme Toggle, Settings Link & System Info */}
      <div style={{ borderColor: 'var(--border-faint)' }} className="p-2 border-t space-y-1">
        {/* Dark / Light Mode Switch */}
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-medium text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] rounded-[2px] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[var(--text-faint)]">
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </span>
            <span>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</span>
          </div>

          <div
            style={{
              backgroundColor: theme === 'dark' ? 'var(--border)' : 'var(--border-faint)',
              borderColor: 'var(--border)',
            }}
            className="w-7 h-4 rounded-full border relative flex items-center p-0.5 transition-colors"
          >
            <span
              style={{
                backgroundColor: theme === 'dark' ? 'var(--brand)' : 'var(--text-faint)',
              }}
              className={`w-2.5 h-2.5 rounded-full transition-transform duration-150 ${
                theme === 'dark' ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-1.5 text-[12px] font-medium transition-colors duration-100 rounded-[2px] ${
              isActive
                ? 'bg-[var(--surface-raised)] text-[var(--text)] font-semibold border-l-2 border-[var(--brand)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] border-l-2 border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex-shrink-0"><SettingsIcon active={isActive} /></span>
              <span>Settings</span>
            </>
          )}
        </NavLink>

        <div className="px-3 pt-1 pb-0.5 flex items-center justify-between text-[10px] font-mono text-[var(--text-faint)]">
          <span>ALPACA PAPER</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)]" />
        </div>
      </div>
    </aside>
  )
}
