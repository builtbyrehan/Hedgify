import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const faqs = [
  {
    q: 'is this real money?',
    a: 'no. hedgify connects to alpaca paper trading — no real funds are at risk. it demonstrates the full pipeline: monitor → detect → hedge. switching to live trading would require additional broker integration and regulatory compliance.',
  },
  {
    q: 'how fast does it react?',
    a: 'in development mode the monitor polls every 10 seconds. in production, the default interval is 15 minutes but is configurable. once a drawdown is detected, the alert-to-hedge cycle completes in under 2 seconds.',
  },
  {
    q: 'what if i already have a hedge on that position?',
    a: 'the idempotency guard checks for an existing active hedge on the same symbol before placing a new one. if one exists, the alert is marked as "skipped" — no duplicate orders, no wasted premium.',
  },
  {
    q: 'can i tune the strike, expiry, and threshold?',
    a: 'yes. all parameters are configurable in the settings page: drawdown threshold (default 2%), put strike offset (default 5% OTM), expiry window (default 14 days), and monitor poll interval.',
  },
  {
    q: 'does it ever sell my shares?',
    a: 'never. hedgify only buys protective put options. your shares stay in your account at all times. that is the entire point — insurance without liquidation.',
  },
  {
    q: 'what broker does it support?',
    a: 'today it supports alpaca paper trading. a model context protocol (MCP) bridge is planned for broker-agnostic support in the future.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid #232428' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-[15px] font-medium transition-colors" style={{ color: '#ECEEF1' }}>
          {q}
        </span>
        <span className="transition-transform duration-200" style={{ color: '#54565C', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[14px] leading-relaxed pb-5 max-w-2xl" style={{ color: '#8A8C93' }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqAccordion() {
  return (
    <section id="faq" className="py-20 px-6" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="max-w-2xl mx-auto">
        <FadeIn>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.02em] text-center mb-12 lowercase" style={{ color: '#ECEEF1' }}>
            faq
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div>
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
