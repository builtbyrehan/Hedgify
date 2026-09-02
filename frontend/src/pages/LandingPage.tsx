import Nav from './landing/Nav'
import Hero from './landing/Hero'
import MarqueeStrip from './landing/MarqueeStrip'
import FeatureSection from './landing/FeatureSection'
import { MonitorMock, ExecutorMock, DashboardMock, StressTestMock, SafetyMock } from './landing/MockPanels'
import HowItWorksStrip from './landing/HowItWorksStrip'
import FaqAccordion from './landing/FaqAccordion'
import ClosingCta from './landing/ClosingCta'
import Footer from './landing/Footer'

const features = [
  {
    number: '01',
    kicker: 'monitor agent',
    headline: 'watches your portfolio 24/7',
    body: 'our ai agent polls your alpaca account continuously, tracking peak value and calculating real-time drawdown. fires an alert the moment drawdown crosses a configurable threshold.',
    bullets: [
      'real-time portfolio value tracking',
      'peak value monitoring across sessions',
      'configurable threshold (default 2%)',
      'instant alert via websocket',
    ],
    cta: { label: 'view portfolio dashboard', href: '/dashboard' },
    mockPanel: <MonitorMock />,
  },
  {
    number: '02',
    kicker: 'hedge executor',
    headline: 'buys protection automatically',
    body: 'on receiving an alert, the executor checks for an existing active hedge (idempotency guard), then automatically calculates a 5% out-of-the-money put strike with a 14-day expiry and places the order.',
    bullets: [
      'idempotency guard prevents duplicate hedges',
      '5% OTM protective put calculation',
      '14-day expiry cycle',
      'automatic order placement via alpaca',
    ],
    cta: { label: 'see active hedges', href: '/dashboard/hedges' },
    mockPanel: <ExecutorMock />,
    align: 'right' as const,
  },
  {
    number: '03',
    kicker: 'live dashboard',
    headline: 'everything updates in real-time',
    body: 'portfolio value chart, active hedge contracts table, real-time activity feed — all pushed instantly over websocket. no manual refresh needed.',
    bullets: [
      'portfolio value chart with time ranges',
      'active hedge contracts table',
      'real-time activity feed',
      'websocket push, no polling required',
    ],
    cta: { label: 'open dashboard', href: '/dashboard' },
    mockPanel: <DashboardMock />,
  },
  {
    number: '04',
    kicker: 'stress test',
    headline: 'watch it react to a crash',
    body: 'pick a symbol and a simulated crash percentage. see unhedged loss vs hedged loss side by side, with a crash protection ratio gauge showing exactly how much capital the hedge preserved.',
    bullets: [
      'simulated crash injection',
      'unhedged vs hedged comparison',
      'crash protection ratio (CPR) gauge',
      'put payout breakdown',
    ],
    cta: { label: 'run a stress test', href: '/dashboard/stress-test' },
    mockPanel: <StressTestMock />,
    align: 'right' as const,
  },
  {
    number: '05',
    kicker: 'built to be safe',
    headline: 'paper trading only. zero risk.',
    body: 'runs on alpaca paper trading — no real funds at risk. graceful degradation with mock data if the backend is offline. auto-reconnecting websocket. a future MCP bridge for broker-agnostic support.',
    bullets: [
      'paper trading only via alpaca',
      'mock data fallback when offline',
      'auto-reconnecting websocket (5s)',
      'MCP bridge planned for other brokers',
    ],
    mockPanel: <SafetyMock />,
  },
  {
    number: '06',
    kicker: 'portfolio insurance',
    headline: 'stop-losses are dead. hedgify is alive.',
    body: 'stop-losses force you to sell. hedgify buys insurance instead. you keep every share, keep your upside, and sleep at night knowing your downside is capped.',
    bullets: [
      'keep every share you own',
      'cap your downside with puts',
      'no forced liquidation, ever',
      'miss no rebounds',
    ],
    mockPanel: (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-[48px]">🛡</div>
        <div className="text-center">
          <div className="text-[13px] font-mono font-medium text-[var(--text)] mb-1">100% shares retained</div>
          <div className="text-[11px] font-mono text-[var(--text-faint)]">every hedge keeps your position intact</div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
          <div className="p-3 bg-[var(--bg)] rounded-[4px] border border-[var(--border-faint)] text-center">
            <div className="text-[9px] font-mono text-[var(--text-faint)] mb-1">stop-loss</div>
            <div className="text-[11px] font-mono text-[var(--negative)]">sell everything</div>
          </div>
          <div className="p-3 bg-[var(--brand)]/5 rounded-[4px] border border-[var(--brand)]/20 text-center">
            <div className="text-[9px] font-mono text-[var(--text-faint)] mb-1">hedgify</div>
            <div className="text-[11px] font-mono text-[var(--brand)]">buy insurance</div>
          </div>
        </div>
      </div>
    ),
    align: 'right' as const,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen text-[#ECEEF1] font-[var(--font-sans)]" style={{ backgroundColor: '#0A0B0D' }}>
      <Nav />
      <Hero />
      <MarqueeStrip />

      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {features.map((f) => (
            <FeatureSection
              key={f.number}
              number={f.number}
              kicker={f.kicker}
              headline={f.headline}
              body={f.body}
              bullets={f.bullets}
              cta={f.cta}
              align={f.align}
              mockPanel={f.mockPanel}
            />
          ))}
        </div>
      </section>

      <HowItWorksStrip />
      <FaqAccordion />
      <ClosingCta />
      <Footer />
    </div>
  )
}
