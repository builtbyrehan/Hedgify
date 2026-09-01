import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardProvider } from './context/DashboardContext'
import { ThemeProvider } from './context/ThemeContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
import PortfolioView from './pages/PortfolioView'
import AlertsPage from './pages/AlertsPage'
import HedgesPage from './pages/HedgesPage'
import StressTestPage from './pages/StressTestPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardProvider>
                <DashboardLayout />
              </DashboardProvider>
            }
          >
            <Route index element={<PortfolioView />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="hedges" element={<HedgesPage />} />
            <Route path="stress-test" element={<StressTestPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
