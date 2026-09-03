import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
